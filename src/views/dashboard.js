/**
 * Generate a colored badge for the dashboard
 */
export function badge(label) {
    const safe = String(label || '').toLowerCase();
    const classes = [
        'no', 'low', 'medium', 'high', 'severe', 'yes', 'advised', 
        'active', 'completed', 'unknown', 'imported', 'imported_updated', 'no_transcript'
    ];
    const cls = classes.includes(safe) ? safe : 'unknown';
    return `<span class="badge ${cls}">${safe || 'unknown'}</span>`;
}

/**
 * Generate the dashboard HTML
 */
export function generateDashboardHTML(conversations) {
    const rows = conversations.map(c => {
        const hasTranscript = c.transcript && c.transcript.trim().length > 0;
        const transcriptStatus = hasTranscript ? 
            `${c.transcript.length} chars` : 
            '<span style="color:#dc2626;">No transcript</span>';
        
        const hasRecording = c.recordingUrl && c.recordingUrl.trim().length > 0;
        const recordingStatus = hasRecording ? 
            `<a href="${c.recordingUrl}" target="_blank" style="color:#059669;text-decoration:none;" title="Play Recording">🎵 Audio</a>` : 
            '<span style="color:#dc2626;">No recording</span>';
            
        return `
        <tr ${c.immediateIntervention ? 'style="background-color:#fef2f2;border-left:4px solid #dc2626;"' : ''}>
            <td style="font-family:sans-serif;padding:8px;font-size:12px;">${c.id.substring(0, 8)}...</td>
            <td style="font-family:sans-serif;padding:8px;">${c.from}</td>
            <td style="font-family:sans-serif;padding:8px;font-size:12px;">${new Date(c.createdAt).toLocaleString()}</td>
            <td style="font-family:sans-serif;padding:8px;font-size:12px;">${new Date(c.updatedAt).toLocaleString()}</td>
            <td style="font-family:sans-serif;padding:8px;">${badge(c.status || 'unknown')}</td>
            <td style="font-family:sans-serif;padding:8px;">${transcriptStatus}</td>
            <td style="font-family:sans-serif;padding:8px;">${recordingStatus}</td>
            <td style="font-family:sans-serif;padding:8px;">${badge(c.tendency)}</td>
            <td style="font-family:sans-serif;padding:8px;">${badge(c.needsCounselling)}</td>
            <td style="font-family:sans-serif;padding:8px;text-align:center;">${c.score || 0}</td>
            <td style="font-family:sans-serif;padding:8px;text-align:center;">${c.immediateIntervention ? '🚨' : '-'}</td>
            <td style="font-family:sans-serif;padding:8px;text-align:center;">${c.geminiAnalysis ? '✅' : '❌'}</td>
            <td style="font-family:sans-serif;padding:8px;">
                <a href="/conversations/${encodeURIComponent(c.id)}">View</a> | 
                <button onclick="refreshConversation('${c.id}')" style="font-size:12px;padding:2px 6px;">Refresh</button>
            </td>
        </tr>
    `}).join('');

    const emergencyCount = conversations.filter(c => c.immediateIntervention || c.tendency === 'severe').length;
    const highRiskCount = conversations.filter(c => c.tendency === 'high').length;
    const missingTranscripts = conversations.filter(c => !c.transcript || c.transcript.trim().length === 0).length;
    const withGeminiAnalysis = conversations.filter(c => c.geminiAnalysis).length;
    const withRecordings = conversations.filter(c => c.recordingUrl && c.recordingUrl.trim().length > 0).length;

    return `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Mental Health Monitoring Dashboard</title>
        <style>
            .badge{display:inline-block;padding:2px 8px;border-radius:12px;color:#fff;font-size:12px}
            .no{background:#64748b}
            .low{background:#22c55e}
            .medium{background:#f59e0b}
            .high{background:#ef4444}
            .severe{background:#7f1d1d}
            .yes{background:#ef4444}
            .advised{background:#f59e0b}
            .active{background:#3b82f6}
            .completed{background:#10b981}
            .unknown{background:#6b7280}
            .no_transcript{background:#7c2d12}
            .stats{display:flex;gap:20px;margin:20px 0;flex-wrap:wrap;}
            .stat-card{background:#f8f9fa;padding:15px;border-radius:8px;text-align:center;min-width:120px;}
            .stat-number{font-size:24px;font-weight:bold;color:#333;}
            .stat-label{font-size:14px;color:#666;}
            .emergency{background:#fee2e2;border-left:4px solid #dc2626;}
            .actions{margin:20px 0;padding:15px;background:#f0f9ff;border-radius:8px;}
            .btn{padding:8px 16px;margin:5px;border:none;border-radius:4px;cursor:pointer;font-size:14px;}
            .btn-primary{background:#3b82f6;color:white;}
            .btn-secondary{background:#6b7280;color:white;}
            .loading{display:none;color:#3b82f6;}
            table{width:100%;margin-top:20px;}
            th{background:#f1f5f9;padding:8px;text-align:left;font-size:13px;}
            td{border-bottom:1px solid #e5e7eb;}
        </style>
    </head>
    <body style="margin:24px;font-family:sans-serif;">
        <h2>🧠 Mental Health Monitoring Dashboard</h2>
        <p><a href="/health">Health Check</a> | <a href="/api/conversations">API</a></p>
        
        <div class="actions">
            <button class="btn btn-primary" onclick="refreshAllConversations()">🔄 Refresh All Missing Transcripts</button>
            <button class="btn btn-primary" onclick="importFromUltravox()" style="background:#059669;">📥 Import from Ultravox</button>
            <button class="btn btn-secondary" onclick="cleanupInvalidCalls()" style="background:#dc2626;">🧹 Cleanup Invalid Calls</button>
            <button class="btn btn-secondary" onclick="location.reload()">🔃 Reload Dashboard</button>
            <span class="loading" id="loading">⏳ Processing...</span>
            <div id="result" style="margin-top:10px;"></div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${conversations.length}</div>
                <div class="stat-label">Total Calls</div>
            </div>
            <div class="stat-card emergency">
                <div class="stat-number">${emergencyCount}</div>
                <div class="stat-label">🚨 Emergency</div>
            </div>
            <div class="stat-card" style="background:#fef3c7;">
                <div class="stat-number">${highRiskCount}</div>
                <div class="stat-label">⚠️ High Risk</div>
            </div>
            <div class="stat-card" style="background:#fee2e2;">
                <div class="stat-number">${missingTranscripts}</div>
                <div class="stat-label">📝 No Transcript</div>
            </div>
            <div class="stat-card" style="background:#dcfce7;">
                <div class="stat-number">${withGeminiAnalysis}</div>
                <div class="stat-label">🤖 AI Analyzed</div>
            </div>
            <div class="stat-card" style="background:#e0f2fe;">
                <div class="stat-number">${withRecordings}</div>
                <div class="stat-label">🎵 With Recording</div>
            </div>
        </div>
        
        <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;min-width:1400px;">
            <thead>
                <tr>
                    <th style="padding:8px;text-align:left;">Call ID</th>
                    <th style="padding:8px;text-align:left;">Phone</th>
                    <th style="padding:8px;text-align:left;">Started</th>
                    <th style="padding:8px;text-align:left;">Updated</th>
                    <th style="padding:8px;text-align:left;">Status</th>
                    <th style="padding:8px;text-align:left;">Transcript</th>
                    <th style="padding:8px;text-align:left;">Recording</th>
                    <th style="padding:8px;text-align:left;">Risk Level</th>
                    <th style="padding:8px;text-align:left;">Counselling</th>
                    <th style="padding:8px;text-align:left;">Score</th>
                    <th style="padding:8px;text-align:left;">Alert</th>
                    <th style="padding:8px;text-align:left;">AI</th>
                    <th style="padding:8px;text-align:left;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        
        <div style="margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;">
            <h4>Legend:</h4>
            <p><strong>Risk Levels:</strong> ${badge('no')} No Risk | ${badge('low')} Low | ${badge('medium')} Medium | ${badge('high')} High | ${badge('severe')} Severe</p>
            <p><strong>Counselling:</strong> ${badge('no')} Not Needed | ${badge('advised')} Recommended | ${badge('yes')} Urgent</p>
            <p><strong>🚨 Alert:</strong> Immediate intervention may be needed | <strong>🤖 AI:</strong> Gemini analysis available</p>
        </div>
        
        <script>
            async function refreshConversation(id) {
                try {
                    document.getElementById('loading').style.display = 'inline';
                    const response = await fetch(\`/api/conversations/\${id}/refresh\`, { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const result = await response.json();
                    document.getElementById('loading').style.display = 'none';
                    
                    if (result.ok) {
                        document.getElementById('result').innerHTML = \`<div style="color:green;">✅ \${result.message}</div>\`;
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        document.getElementById('result').innerHTML = \`<div style="color:red;">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('result').innerHTML = \`<div style="color:red;">❌ Error: \${error.message}</div>\`;
                }
            }
            
            async function refreshAllConversations() {
                try {
                    document.getElementById('loading').style.display = 'inline';
                    const response = await fetch('/api/conversations/refresh-all', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const result = await response.json();
                    document.getElementById('loading').style.display = 'none';
                    
                    if (result.ok) {
                        const updated = result.results.filter(r => r.status === 'updated').length;
                        const failed = result.results.filter(r => r.status === 'failed').length;
                        document.getElementById('result').innerHTML = \`<div style="color:green;">✅ Processed \${result.results.length} conversations: \${updated} updated, \${failed} failed</div>\`;
                        setTimeout(() => location.reload(), 3000);
                    } else {
                        document.getElementById('result').innerHTML = \`<div style="color:red;">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('result').innerHTML = \`<div style="color:red;">❌ Error: \${error.message}</div>\`;
                }
            }
            
            async function importFromUltravox() {
                try {
                    document.getElementById('loading').style.display = 'inline';
                    const response = await fetch('/api/conversations/import-from-ultravox', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ limit: 20 })
                    });
                    const result = await response.json();
                    document.getElementById('loading').style.display = 'none';
                    
                    if (result.ok) {
                        const created = result.summary.created;
                        const updated = result.summary.updated;
                        document.getElementById('result').innerHTML = \`<div style="color:green;">📥 Import complete: \${created} new calls, \${updated} updated calls</div>\`;
                        setTimeout(() => location.reload(), 3000);
                    } else {
                        document.getElementById('result').innerHTML = \`<div style="color:red;">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('result').innerHTML = \`<div style="color:red;">❌ Error: \${error.message}</div>\`;
                }
            }
            
            async function cleanupInvalidCalls() {
                try {
                    document.getElementById('loading').style.display = 'inline';
                    const response = await fetch('/api/conversations/cleanup-invalid', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const result = await response.json();
                    document.getElementById('loading').style.display = 'none';
                    
                    if (result.ok) {
                        const invalid = result.summary.invalid;
                        const valid = result.summary.valid;
                        document.getElementById('result').innerHTML = \`<div style="color:green;">🧹 Cleanup complete: \${valid} valid calls, \${invalid} invalid calls found</div>\`;
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        document.getElementById('result').innerHTML = \`<div style="color:red;">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('result').innerHTML = \`<div style="color:red;">❌ Error: \${error.message}</div>\`;
                }
            }
        </script>
    </body>
    </html>`;
}