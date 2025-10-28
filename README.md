# Automation Analyst - Technical Assessment (n8n Web Scraper)

This repository contains the solution for the Automation Analyst technical assessment. The project consists of a single, robust n8n workflow designed to scrape websites, process content using AI, and store the resulting data as vectors in a Supabase database for semantic search.

## Project Overview

The core of this project is an n8n workflow (`workflow.json`) that automates a complex data pipeline. It is designed to be a resilient, "set-it-and-forget-it" process that:

1.  Reads jobs from a Google Sheets "queue."
2.  Scrapes a target website and its sub-pages using Puppeteer.
3.  Uses a fallback API (`Scrape.do`) if Puppeteer fails.
4.  Uses AI (Google Gemini) to extract clean, relevant content from raw HTML.
5.  Generates embeddings (vectors) for the content.
6.  Stores the vectors and metadata in a Supabase database.
7.  Updates the Google Sheet with the job status ('completed' or 'failed').

## Features Implemented

This workflow successfully implements the core technical requirements of the assessment:

* **[x] Robust JS-Rendered Scraping:** Uses Puppeteer as the primary scraper (`PuppeteerScraper`) to handle modern, JavaScript-heavy websites.
* **[x] Automatic Fallback:** Automatically triggers a secondary scraping API (`Scrape.do`) when the primary Puppeteer scrape fails (e.g., due to bot detection or empty content), ensuring high data retrieval rates.
* **[x] CAPTCHA Detection:** The `PuppeteerScraper` script includes logic to detect the presence of CAPTCHAs (`pageContent.toLowerCase().includes('captcha')`). If detected, it stops the scrape for that page and logs the error, preventing the workflow from stalling.
* **[x] Deep Scraping (1-Level):** The workflow scrapes the main page, discovers up to 10 sub-links, and then processes each of those 10 links in a scalable loop.
* **[x] AI-Powered Content Extraction:** Uses AI Agents (`MainPageAIAgent`, `AIAgentSubpage`) to parse the raw, noisy HTML and extract only the relevant, clean text based on dynamic `instructions` provided in the Google Sheet.
* **[x] Vector Storage:** Generates 1536-dimension embeddings for each content chunk using Google's `gemini-embedding-001` model and stores them in a `scraped_content` table in Supabase.
* **[x] Job Queue Management:** The entire process is driven by a Google Sheet. The workflow fetches rows with `status = 'pending'` and writes back the final 'completed' or 'failed' status, providing a clear audit trail.

---

## Tooling, Assumptions, and Substitutions

To meet the architectural goals of the assessment, the following tools were used. Note that some direct equivalents were substituted due to API accessibility.

| Requirement | Tool Specified in Brief | Tool Implemented in Workflow | Justification |
| :--- | :--- | :--- | :--- |
| **AI Processing** | Grok Free API | **Google Gemini (via AI Studio)** | The free tier for Grok was not accessible. Google's Gemini models were used as a direct, powerful substitute. The architectural pattern (AI Agent for extraction, Embedding Model for vectorization) is identical. |
| **Fallback Scraper** | CloudScraper API | **Scrape.do API** | `Scrape.do` was used as the external scraping API fallback. Its function is identical to the one requested: provide a robust alternative when Puppeteer is blocked. |
| **Embedding Model** | Grok Embedding Model | **Google Embedding Model** | Google's `gemini-embedding-001` was used to generate embeddings. The vector dimension (1536) was used to configure the Supabase table. |
| **CAPTCHA Handling** | 2captcha / Anti-Captcha | **Detection Only** | The workflow implements CAPTCHA *detection*. If a CAPTCHA is found, the job fails gracefully and is logged. A full integration with a *solving* service was scoped out as a "basic implementation" and would add significant complexity. |

## Workflow Architecture

The workflow logic is complex and uses parallel processing for efficiency. Here is a step-by-step breakdown:

1.  **Initiation (`GetPendingURL`):** Fetches the first job from Google Sheets where `status = 'pending'`.
2.  **Main Scrape (`PuppeteerScraper`):** Attempts to scrape the main URL using Puppeteer. Extracts both the page `content` and a list of `links`.
3.  **Quality Control (`Switch`):** This is the core error-handling router. It checks the scrape result:
    * **Path 0 (OK):** `content` is not empty AND `links` are not empty. This is the "happy path."
    * **Path 1 & 2 (Fallback):** If `content` is empty OR `links` are empty, the scrape is considered a failure.
4.  **Fallback Logic (`Scrape.do1`):** If the `Switch` routes to a failure path, this node attempts the scrape again using the `Scrape.do` external API.
5.  **Consolidation (`Merge`):** This node collects the successful result from *either* the `PuppeteerScraper` or the `Scrape.do1` fallback.
6.  **Parallel Processing (The Split):** After consolidation, the workflow splits into two parallel branches:
    * **Branch A (Main Page):** The main page's content is sent to the `MainPageAIAgent` for AI-based text extraction.
    * **Branch B (Sub-Pages):** The list of 10 links is processed by a loop (`Split Out` -> `Subpage Scrapper`). This loop scrapes *each* of the 10 sub-pages (with its *own* Puppeteer/Scrape.do fallback logic) and sends each one to the `AIAgentSubpage` for AI processing.
7.  **Final Aggregation:**
    * `AggregateSubpages` gathers all 10 processed sub-page results.
    * `Merge2` and `FinalFormatter` combine the processed main page data (Branch A) and the aggregated sub-page data (Branch B) into a single, clean dataset.
8.  **Job-Queue Update (`Update row in sheet`):** The workflow updates the original row in Google Sheets with the final status (`completed` or `failed`) and any error notes.
9.  **Vector Pipeline (Final Stage):**
    * `ChunkContent`: The clean text is broken into small, logical chunks.
    * `HTTP Request` (Gemini Embedding): Generates a vector for each chunk.
    * `Code in JavaScript`: Formats the data to match the Supabase schema.
    * `Create a row` (Supabase): Inserts the `chunk_text`, `embedding`, `source_url`, and other metadata into the vector database.

---

## Setup & Credentials

To run this workflow, you must set up the following 5 credentials in your n8n instance:

| Credential Name (in n8n) | Type | Used By Nodes |
| :--- | :--- | :--- |
| `GoogleAuthSheets` | Google OAuth2 | `GetPendingURL`, `Append row in sheet`, `Update row in sheet` |
| `Google Gemini(PaLM) Api` | Google AI Studio API Key | `Embedding Model`, `Fallback Model` (for AI Agents) |
| `Google Embedding Auth` | HTTP Header Auth | `HTTP Request` (for generating embeddings) |
| `Query Auth account` | Query Auth | `Scrape.do1`, `Scrape.do2` (Fallback Scraper) |
| `Supabase account` | Supabase API | `Create a row` (Vector Storage) |

### Google Sheets Configuration

Your Google Sheet must have the following columns:
`url`, `instructions`, `status`, `last_updated`, `error_notes`

### Supabase Database Schema

Use the following SQL to set up your `scraped_content` table in Supabase. This schema is fully compatible with the workflow's output.

```sql
-- Ensure you have the pgvector extension enabled in Supabase
CREATE TABLE scraped_content (
  id SERIAL PRIMARY KEY,
  source_url TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  total_chunks INTEGER,
  embedding vector(1536), -- Dimension for Google's gemini-embedding-001
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create an index for fast vector similarity search
CREATE INDEX ON scraped_content
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```
## Mandatory Questions
### Q: What was the most difficult part and how did you solve it?
A: The most challenging part was managing the asynchronous and parallel data flows. The workflow scrapes the main page and then kicks off 10 independent sub-page scrapes. Ensuring that the final data aggregation (Merge2) would only happen after both the main page AI processing AND all 10 sub-page AI processes were complete required careful workflow design.

Solution: I used the AggregateSubpages node to collect all results from the sub-page loop. This node inherently waits for all 10 items to finish. This aggregated result was then fed into the Merge2 node, which also waited for the main page processing branch. This created a synchronization point, guaranteeing all data was processed before the final formatting and database insertion steps.

### Q: If we needed to process 500 URLs daily, what would you change?
A: The current one-by-one design would be a bottleneck. To scale to 500 URLs/day, I would make two major changes:
Batch Processing & Concurrency: Instead of GetPendingURL fetching 1 item, I would modify it to fetch all 500 'pending' rows at once. This turns the entire workflow into a 500-item batch. I would then set n8n's workflow concurrency (e.g., to 10) to process 10 of these URLs simultaneously.

Sub-Workflows: The best solution for this scale is to refactor the logic. I would create a "Main" workflow that fetches all 500 jobs. Then, I would use a Split in Batches node to pass batches of 10-20 jobs to a "Child" sub-workflow (using the Execute Workflow node). This "Child" workflow would contain the core Scrape-Process-Store logic. This pattern is far more robust, scalable, and easier to monitor than running one giant 500-item execution.

### Q: Name one feature you'd add given more time.
A: A dedicated retry queue for failed jobs (Bonus Point #3). Currently, a job is marked 'failed' and the workflow moves on. I would add logic so that any job that fails (due to a CAPTCHA or repeated timeouts) is written to a separate 'retry_queue' sheet in Google Sheets. A second, simpler n8n workflow, scheduled to run nightly, would attempt to re-process these failed jobs, perhaps using a different scraper or a residential proxy. This would maximize data recovery without complicating the main, high-speed workflow.