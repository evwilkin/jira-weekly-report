# Jira Weekly Report Generator

A Node.js application that generates weekly reports from Jira by fetching issues from specific projects that have received comments in the past 7 days.

## Features

- Fetches issues from **PF** and **UXDENG** projects
- Filters issues that affect version **"Q3 2025"**
- Identifies issues with comments added in the past 7 days
- Extracts and summarizes recent comments for each issue
- Generates both console output and JSON report file

## Prerequisites

- Node.js (version 18 or higher)
- Jira Personal Access Token (PAT)
- Access to Jira instance with PF and UXDENG projects

## Setup

1. **Clone/Download the project**
   ```bash
   cd jira-weekly-report
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your Jira credentials:
   ```
   JIRA_URL=https://your-domain.atlassian.net
   JIRA_PAT=your_personal_access_token_here
   ```

4. **Generate a Jira Personal Access Token**
   - Go to your Jira instance
   - Navigate to Account Settings → Security → API tokens
   - Create a new token and copy it to your `.env` file

## Usage

### Run the report generator

```bash
npm start
```

### Development mode (with auto-restart)

```bash
npm run dev
```

## Output

The application will:

1. **Console Output**: Display a formatted report with:
   - Issue key and summary
   - Issue URL
   - Number of recent comments
   - Comment details (author, date, text preview)

2. **JSON File**: Save a detailed report as `jira-weekly-report-YYYY-MM-DD.json` containing:
   - Generation timestamp
   - Search criteria used
   - Complete issue and comment data

## Example Output

```
🔍 Searching for issues in PF and UXDENG projects with Q3 2025 affected version...
Found 3 issues with recent comments

📊 WEEKLY JIRA REPORT
====================
Generated at: 2024-01-15T10:30:00.000Z
Projects: PF, UXDENG
Affected Version: Q3 2025
Comments Period: Last 7 days

Found 3 issues with recent comments:

1. PF-1234: Fix component styling issues
   URL: https://your-domain.atlassian.net/browse/PF-1234
   Recent Comments: 2
   Comment 1:
     Author: John Doe
     Date: 1/14/2024
     Text: Updated the CSS to fix the alignment issue...

2. UXDENG-5678: Update design tokens
   URL: https://your-domain.atlassian.net/browse/UXDENG-5678
   Recent Comments: 1
   Comment 1:
     Author: Jane Smith
     Date: 1/13/2024
     Text: Added new color tokens as requested...

💾 Report saved as: jira-weekly-report-2024-01-15.json
```

## Configuration

The application searches for issues using this JQL query:
```jql
project in (PF, UXDENG) AND 
affectedVersion = "Q3 2025" AND 
commented >= -7d
```

You can modify the search criteria by editing the `searchIssues()` function in `src/index.js`.

## Error Handling

The application includes error handling for:
- Missing environment variables
- Jira API connection issues
- Invalid responses
- Network timeouts

## Dependencies

- **axios**: HTTP client for Jira API calls
- **dotenv**: Environment variable loading
- **date-fns**: Date manipulation and formatting

## API Endpoints Used

- `GET /rest/api/3/search` - Search for issues
- `GET /rest/api/3/issue/{issueKey}/comment` - Fetch issue comments

## Troubleshooting

1. **Authentication errors**: Verify your JIRA_PAT is valid and has necessary permissions
2. **No issues found**: Check if the affected version "Q3 2025" exists in your projects
3. **API errors**: Ensure your JIRA_URL is correct and accessible

## License

MIT 
