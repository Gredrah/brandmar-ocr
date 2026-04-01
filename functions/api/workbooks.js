// webapp/functions/api/workbooks.js
import { getCookie } from './auth/authHelpers.js';

// API Endpoint: GET /api/workbooks
// Consumed by: BrandmarAPI.getAvailableWorkbooks()
// Description: Queries Google Drive for files matching the specific workbook naming convention and returns an array of options.
export async function onRequestGet(context) {
    try {
        // 1. Session & Auth Check
        // If these fail, a 401 is sent to the frontend. The SDK uses this 401 specifically to determine if BrandmarAPI.isAuthenticated() is true or false.
        const sessionId = getCookie(context.request, 'session_id');
        if (!sessionId) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }

        const accessToken = await context.env.AUTH_KV.get(`session:${sessionId}`);
        if (!accessToken) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }

        // 2. Build the Google Drive Search Query
        // We filter for spreadsheets, exclude the trash, and look for your specific naming scheme
        const searchQuery = "mimeType='application/vnd.google-apps.spreadsheet' and name contains 'Brandmar Holdings' and trashed=false";
        
        // URL encode the query so it travels safely over HTTP
        const encodedQuery = encodeURIComponent(searchQuery);
        
        // Request only the ID and Name fields to keep the payload tiny and fast, ordered newest first
        const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=files(id,name)&orderBy=createdTime desc`;

        const response = await fetch(driveApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Drive API Error: ${errorText}`);
        }

        const data = await response.json();
        const allFiles = data.files || [];

        // 3. Apply Regex Filter in JavaScript
        // This matches "Brandmar Holdings " followed by exactly 4 digits (the year)
        const yearRegex = /.*Brandmar Holdings \d{4}.*/;
        const filteredFiles = allFiles.filter(file => yearRegex.test(file.name));

        // 4. Return the filtered array to the frontend
        // Expected format: [{ id: "...", name: "..." }, ...]
        return new Response(JSON.stringify(filteredFiles), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}