# Jira Weekly Report Generator

A Node.js application that generates weekly reports from Jira by fetching issues from specific projects that have received comments in the past 7 days.

## Features

- Fetches issues from **PF** and **UXDENG** projects
- Automatically detects current quarter and year for filtering (e.g., **"Q4 2025"**)
- Supports custom affected version specification via environment variable or GitHub Action input
- Identifies issues with comments added in the past 7 days
- Extracts and summarizes recent comments for each issue
- Generates both console output and JSON report file

## Prerequisites

- Node.js (version 18 or higher)
- Jira Personal Access Token (PAT)
- Access to Red Hat Jira instance (https://issues.redhat.com) with PF and UXDENG projects

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
   touch .env
   ```
   
   Edit the `.env` file with your Jira credentials:
   ```
   JIRA_PAT=your_personal_access_token_here
   # Optional: Override the affected version (defaults to current quarter)
   # AFFECTED_VERSION=Q4 2025
   ```

4. **Generate a Jira Personal Access Token**
   - Go to https://issues.redhat.com
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

## GitHub Actions Integration

This project includes a GitHub Actions workflow that automatically runs the report generation:

- **Scheduled**: Runs every Thursday at 1:00 PM UTC (uses current quarter automatically)
- **Manual trigger**: Can be manually triggered from the Actions tab with optional affected version input
- **Dynamic quarter detection**: Automatically detects current quarter (Q1-Q4) and year when no input is provided
- **Custom affected version**: When manually triggered, you can specify a custom affected version (e.g., "Q3 2025")
- **Artifact output**: Generated JSON reports are uploaded as artifacts with 3-day retention
- **Environment**: Uses the `JIRA_PAT` secret for authentication

The workflow automatically handles the report generation and makes the JSON output available for download without committing files to the repository.

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
   
   **Note**: When running via GitHub Actions, the JSON file is automatically uploaded as an artifact and available for download from the Actions tab, rather than being committed to the repository.

## Example Output

```
🔍 Searching for issues in PF and UXDENG projects with Q4 2025 affected version...
Found 3 issues with recent comments

📊 WEEKLY JIRA REPORT
====================
Generated at: 2024-01-15T10:30:00.000Z
Projects: PF, UXDENG
Affected Version: Q4 2025
Comments Period: Last 7 days

Found 3 issues with recent comments:

1. PF-1234: Fix component styling issues
   URL: https://issues.redhat.com/browse/PF-1234
   Recent Comments: 2
   Comment 1:
     Author: John Doe
     Date: 1/14/2024
     Text: Updated the CSS to fix the alignment issue...

2. UXDENG-5678: Update design tokens
   URL: https://issues.redhat.com/browse/UXDENG-5678
   Recent Comments: 1
   Comment 1:
     Author: Jane Smith
     Date: 1/13/2024
     Text: Added new color tokens as requested...

💾 Report saved as: jira-weekly-report-2024-01-15.json
```

## Configuration

The application dynamically generates its JQL query based on the current quarter and year (or specified affected version):
```jql
project in (PF, UXDENG) AND 
type = "Epic" AND
affectedVersion = "[Current Quarter YYYY]" AND 
updated >= -4d
```

**Quarter Calculation:**
- Q1: January, February, March
- Q2: April, May, June  
- Q3: July, August, September
- Q4: October, November, December

**Customization Options:**
- Set `AFFECTED_VERSION` environment variable to override quarter detection
- Use GitHub Action input for manual runs with custom affected version
- Modify search criteria by editing the `searchIssues()` function in `src/index.js`

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

- `GET https://issues.redhat.com/rest/api/2/search` - Search for issues
- `GET https://issues.redhat.com/rest/api/2/issue/{issueKey}/comment` - Fetch issue comments

## Troubleshooting

1. **Authentication errors**: Verify your JIRA_PAT is valid and has necessary permissions
2. **No issues found**: Check if the affected version exists in your projects. The application auto-detects current quarter (e.g., "Q4 2025") or uses your custom `AFFECTED_VERSION` if specified
3. **Wrong quarter detected**: Verify the current date - quarters are calculated as Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
4. **Custom affected version not working**: Ensure `AFFECTED_VERSION` environment variable is set correctly (format: "Q# YYYY")
5. **Connection issues**: The application connects to https://issues.redhat.com - ensure you have access to this Jira instance

## License

MIT 
