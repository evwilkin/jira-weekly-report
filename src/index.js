import axios from 'axios';
import dotenv from 'dotenv';
import { subDays, isAfter, parseISO } from 'date-fns';
import { extractCommentText, formatDate, truncateText } from './utils.js';

const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

// Load environment variables
dotenv.config();

/**
 * Get current quarter and year in format "Q# YYYY"
 */
function getCurrentQuarter() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
  const year = now.getFullYear();
  
  let quarter;
  if (month >= 1 && month <= 3) {
    quarter = 1;
  } else if (month >= 4 && month <= 6) {
    quarter = 2;
  } else if (month >= 7 && month <= 9) {
    quarter = 3;
  } else {
    quarter = 4;
  }
  
  return `Q${quarter} ${year}`;
}

// Initialize Jira client
const jiraClient = axios.create({
  baseURL: 'https://issues.redhat.com/',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.JIRA_PAT}`,
  },
});

/**
 * Search for issues in specified projects with recent comments
 */
async function searchIssues(affectedVersion) {
  try {
    const jql = `
      project in (PF, UXDENG) AND 
      type = "Epic" AND
      affectedVersion = "${affectedVersion}" AND 
      updated >= -6d
    `;

    const response = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: jql.replace(/\s+/g, ' ').trim(),
        fields: 'key,summary,created,updated',
        maxResults: 100,
      },
    });

    return response.data.issues || [];
  } catch (error) {
    console.error(
      'Error searching for issues:',
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Fetch comments for a specific issue
 */
async function fetchIssueComments(issueKey) {
  try {
    await delay();
    const response = await jiraClient.get(
      `/rest/api/2/issue/${issueKey}/comment`,
      {
        params: {
          orderBy: 'created',
          maxResults: 1000,
        },
      }
    );

    return response.data.comments || [];
  } catch (error) {
    console.error(
      `Error fetching comments for issue ${issueKey}:`,
      error.response?.data || error.message
    );
    return [];
  }
}

/**
 * Filter comments to only include those from the past 7 days
 */
function filterRecentComments(comments) {
  const threeDaysAgo = subDays(new Date(), 6);

  return comments.filter((comment) => {
    const commentDate = parseISO(comment.created);
    return isAfter(commentDate, threeDaysAgo);
  });
}

/**
 * Format comment data for display
 */
function formatComment(comment) {
  const body = extractCommentText(comment.body);
  // Extract author from comment if Github comment
  const authorMatch = /Comment Author: (.*)\n/.exec(body);
  const author = authorMatch ? authorMatch[1] : comment.author.displayName; 
    
  return {
    id: comment.id,
    author,
    created: comment.created,
    body,
    updated: comment.updated,
  };
}

/**
 * Generate summary for an issue with its recent comments
 */
async function generateIssueSummary(issue) {
  console.log(`\nProcessing issue: ${issue.key} - ${issue.fields.summary}`);

  const allComments = await fetchIssueComments(issue.key);
  const recentComments = filterRecentComments(allComments);

  if (recentComments.length === 0) {
    console.log(`No recent comments found for ${issue.key}`);
    return null;
  }

  const formattedComments = recentComments.map(formatComment);

  return {
    issueKey: issue.key,
    issueSummary: issue.fields.summary,
    issueUrl: `https://issues.redhat.com/browse/${issue.key}`,
    recentCommentsCount: recentComments.length,
    comments: formattedComments,
  };
}

/**
 * Main function to generate the weekly report
 */
async function generateWeeklyReport() {
  try {
    // Get affected version from environment or use current quarter as default
    const affectedVersion = process.env.AFFECTED_VERSION || getCurrentQuarter();
    
    console.log(
      `🔍 Searching for issues in PF and UXDENG projects with ${affectedVersion} affected version...`
    );

    if (!process.env.JIRA_PAT) {
      throw new Error(
        'Missing required environment variable: JIRA_PAT'
      );
    }

    const issues = await searchIssues(affectedVersion);
    console.log(`Found ${issues.length} issues with recent comments`);

    if (issues.length === 0) {
      console.log('No issues found matching the criteria.');
      return;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      searchCriteria: {
        projects: ['PF', 'UXDENG'],
        affectedVersion: affectedVersion,
        commentsPeriod: 'Last 7 days',
      },
      issues: [],
    };

    // Process each issue and fetch its recent comments
    for (const issue of issues) {
      const issueSummary = await generateIssueSummary(issue);
      if (issueSummary) {
        report.issues.push(issueSummary);
      }
    }

    // Display the report
    console.log('\n📊 WEEKLY JIRA REPORT');
    console.log('====================');
    console.log(`Generated at: ${report.generatedAt}`);
    console.log(`Projects: ${report.searchCriteria.projects.join(', ')}`);
    console.log(`Affected Version: ${report.searchCriteria.affectedVersion}`);
    console.log(`Comments Period: ${report.searchCriteria.commentsPeriod}`);
    console.log(`\nFound ${report.issues.length} issues with recent comments:`);

    report.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.issueKey}: ${issue.issueSummary}`);
      console.log(`   URL: ${issue.issueUrl}`);
      console.log(`   Recent Comments: ${issue.recentCommentsCount}`);
      /* Hide comments from logging
      issue.comments.forEach((comment, commentIndex) => {
        console.log(`   Comment ${commentIndex + 1}:`);
        console.log(`     Author: ${comment.author}`);
        console.log(`     Date: ${formatDate(comment.created)}`);
        console.log(`     Text: ${truncateText(comment.body, 150)}`);
      });
      */
    });

    if (report.issues.length > 0) {
      // Save the report as JSON for GitHub Actions artifact
      const fs = await import('fs');
      
      const reportFileName = `jira-weekly-report-${
        new Date().toISOString().split('T')[0]
      }.json`;
      
      fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved as: ${reportFileName}`);
    }
  } catch (error) {
    console.error('Error generating weekly report:', error.message);
    process.exit(1);
  }
}

// Run the report generation
generateWeeklyReport();
