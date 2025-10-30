/**
 * Generate a colored badge for the dashboard
 */
export function badge(label, type = 'default') {
    const safe = String(label || '').toLowerCase();
    const classes = [
        'no', 'low', 'medium', 'high', 'severe', 'yes', 'advised', 
        'active', 'completed', 'unknown', 'imported', 'imported_updated', 'no_transcript'
    ];
    const cls = classes.includes(safe) ? safe : 'unknown';
    
    // Add visual indicators
    let icon = '';
    switch (safe) {
        case 'severe': icon = '🚨'; break;
        case 'high': icon = '⚠️'; break;
        case 'medium': icon = '⚡'; break;
        case 'low': icon = '💭'; break;
        case 'yes': icon = '🆘'; break;
        case 'advised': icon = '💡'; break;
        case 'completed': icon = '✅'; break;
        case 'active': icon = '🔄'; break;
        default: icon = '';
    }
    
    return `<span class="badge ${cls}" title="${safe}">${icon} ${safe || 'unknown'}</span>`;
}

/**
 * Generate analytics cards for the dashboard
 */
function generateAnalyticsCards(conversations) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const todayCalls = conversations.filter(c => new Date(c.createdAt) >= today);
    const weekCalls = conversations.filter(c => new Date(c.createdAt) >= thisWeek);
    
    const emergencyCount = conversations.filter(c => c.immediateIntervention || c.tendency === 'severe').length;
    const highRiskCount = conversations.filter(c => c.tendency === 'high').length;
    const needsCounselling = conversations.filter(c => c.needsCounselling === 'yes').length;
    const withAnalysis = conversations.filter(c => c.geminiAnalysis && !c.geminiAnalysis.error).length;
    
    const avgScore = conversations.length > 0 ? 
        (conversations.reduce((sum, c) => sum + (c.score || 0), 0) / conversations.length).toFixed(1) : '0';
    
    return `
    <div class="analytics-grid">
        <div class="analytics-card total-calls">
            <div class="card-header">
                <h3>📊 Total Conversations</h3>
                <span class="timeframe">All Time</span>
            </div>
            <div class="metric-value">${conversations.length}</div>
            <div class="metric-details">
                <span>Today: ${todayCalls.length}</span>
                <span>This Week: ${weekCalls.length}</span>
            </div>
        </div>
        
        <div class="analytics-card emergency">
            <div class="card-header">
                <h3>🚨 Critical Alerts</h3>
                <span class="alert-indicator ${emergencyCount > 0 ? 'active' : ''}"></span>
            </div>
            <div class="metric-value">${emergencyCount}</div>
            <div class="metric-details">
                <span>Immediate Intervention Needed</span>
            </div>
        </div>
        
        <div class="analytics-card high-risk">
            <div class="card-header">
                <h3>⚠️ High Risk</h3>
            </div>
            <div class="metric-value">${highRiskCount}</div>
            <div class="metric-details">
                <span>Requires Monitoring</span>
            </div>
        </div>
        
        <div class="analytics-card counselling">
            <div class="card-header">
                <h3>🆘 Counselling</h3>
            </div>
            <div class="metric-value">${needsCounselling}</div>
            <div class="metric-details">
                <span>Professional Help Recommended</span>
            </div>
        </div>
        
        <div class="analytics-card ai-analysis">
            <div class="card-header">
                <h3>🤖 AI Analysis</h3>
            </div>
            <div class="metric-value">${withAnalysis}/${conversations.length}</div>
            <div class="metric-details">
                <span>Coverage: ${conversations.length > 0 ? Math.round((withAnalysis / conversations.length) * 100) : 0}%</span>
            </div>
        </div>
        
        <div class="analytics-card avg-score">
            <div class="card-header">
                <h3>📈 Avg Risk Score</h3>
            </div>
            <div class="metric-value">${avgScore}</div>
            <div class="metric-details">
                <span>Scale: 0-10</span>
            </div>
        </div>
    </div>
    `;
}

/**
 * Generate the dashboard HTML
 */
export function generateDashboardHTML(conversations) {
    const rows = conversations
        .sort((a, b) => {
            // Sort by priority: emergency first, then by creation date (newest first)
            if (a.immediateIntervention && !b.immediateIntervention) return -1;
            if (!a.immediateIntervention && b.immediateIntervention) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .map(c => {
        const hasTranscript = c.transcript && c.transcript.trim().length > 0;
        const transcriptStatus = hasTranscript ? 
            `<span class="transcript-status available" title="${c.transcript.length} characters">${Math.round(c.transcript.length/100)}00+ chars</span>` : 
            '<span class="transcript-status missing">No transcript</span>';
        
        const hasRecording = c.recordingUrl && c.recordingUrl.trim().length > 0;
        const recordingStatus = hasRecording ? 
            `<a href="${c.recordingUrl}" target="_blank" class="recording-link" title="Play Recording">🎵</a>` : 
            '<span class="recording-missing">❌</span>';
        
        const timeSinceCreated = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60));
        const timeDisplay = timeSinceCreated < 24 ? `${timeSinceCreated}h ago` : `${Math.floor(timeSinceCreated/24)}d ago`;
        
        const aiAnalysisStatus = c.geminiAnalysis && !c.geminiAnalysis.error ? 
            `<span class="ai-status available" title="AI Analysis Available">🤖</span>` : 
            '<span class="ai-status missing" title="No AI Analysis">❌</span>';
            
        return `
        <tr class="conversation-row ${c.immediateIntervention ? 'emergency-row' : ''} ${c.tendency}" data-id="${c.id}">
            <td class="cell-id" title="${c.id}">
                <span class="id-short">${c.id.substring(0, 8)}...</span>
                ${c.immediateIntervention ? '<span class="emergency-indicator">🚨</span>' : ''}
            </td>
            <td class="cell-phone">${c.from}</td>
            <td class="cell-time" title="${new Date(c.createdAt).toLocaleString()}">${timeDisplay}</td>
            <td class="cell-status">${badge(c.status || 'unknown')}</td>
            <td class="cell-transcript">${transcriptStatus}</td>
            <td class="cell-recording text-center">${recordingStatus}</td>
            <td class="cell-risk">${badge(c.tendency)}</td>
            <td class="cell-counselling">${badge(c.needsCounselling)}</td>
            <td class="cell-score text-center">
                <span class="score-value ${c.score >= 8 ? 'high-score' : c.score >= 4 ? 'medium-score' : 'low-score'}">${c.score || 0}</span>
            </td>
            <td class="cell-ai text-center">${aiAnalysisStatus}</td>
            <td class="cell-actions">
                <div class="action-buttons">
                    <a href="/conversations/${encodeURIComponent(c.id)}" class="action-btn view-btn" title="View Details">👁️</a>
                    <button onclick="refreshConversation('${c.id}')" class="action-btn refresh-btn" title="Refresh Data">🔄</button>
                </div>
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
            /* Reset and base styles */
            * { box-sizing: border-box; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
            
            /* Badge styles */
            .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 20px; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .no { background: linear-gradient(135deg, #64748b, #475569); }
            .low { background: linear-gradient(135deg, #22c55e, #16a34a); }
            .medium { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .high { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .severe { background: linear-gradient(135deg, #7f1d1d, #991b1b); box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }
            .yes { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .advised { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .active { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .completed { background: linear-gradient(135deg, #10b981, #059669); }
            .unknown { background: linear-gradient(135deg, #6b7280, #4b5563); }
            .no_transcript { background: linear-gradient(135deg, #7c2d12, #92400e); }

            /* Analytics grid */
            .analytics-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 20px; 
                margin: 20px 0; 
            }
            .analytics-card { 
                background: linear-gradient(135deg, #fff 0%, #f8fafc 100%); 
                border-radius: 12px; 
                padding: 20px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;
            }
            .analytics-card:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
            }
            .analytics-card.emergency { 
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
                border-color: #fecaca; 
            }
            .analytics-card.high-risk { 
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
                border-color: #fde68a; 
            }
            .analytics-card.counselling { 
                background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); 
                border-color: #fecdd3; 
            }
            .analytics-card.ai-analysis { 
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                border-color: #bae6fd; 
            }
            .card-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 12px; 
            }
            .card-header h3 { 
                margin: 0; 
                font-size: 14px; 
                font-weight: 600; 
                color: #374151; 
            }
            .metric-value { 
                font-size: 32px; 
                font-weight: 800; 
                color: #1f2937; 
                margin: 8px 0; 
            }
            .metric-details { 
                display: flex; 
                flex-direction: column; 
                gap: 4px; 
                font-size: 12px; 
                color: #6b7280; 
            }
            .alert-indicator { 
                width: 12px; 
                height: 12px; 
                border-radius: 50%; 
                background: #d1d5db; 
                animation: pulse 2s infinite; 
            }
            .alert-indicator.active { 
                background: #dc2626; 
            }
            @keyframes pulse { 
                0%, 100% { opacity: 1; } 
                50% { opacity: 0.5; } 
            }

            /* Action buttons */
            .actions { 
                margin: 20px 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                border-radius: 12px; 
                border: 1px solid #bae6fd; 
            }
            .btn { 
                padding: 10px 16px; 
                margin: 5px; 
                border: none; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 14px; 
                font-weight: 600; 
                transition: all 0.2s ease; 
                text-decoration: none; 
                display: inline-block; 
            }
            .btn:hover { transform: translateY(-1px); }
            .btn-primary { 
                background: linear-gradient(135deg, #3b82f6, #2563eb); 
                color: white; 
                box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); 
            }
            .btn-primary:hover { 
                background: linear-gradient(135deg, #2563eb, #1d4ed8); 
                box-shadow: 0 6px 12px -1px rgba(59, 130, 246, 0.4); 
            }
            .btn-secondary { 
                background: linear-gradient(135deg, #6b7280, #4b5563); 
                color: white; 
                box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3); 
            }
            .btn-secondary:hover { 
                background: linear-gradient(135deg, #4b5563, #374151); 
            }
            .loading { 
                display: none; 
                color: #3b82f6; 
                font-weight: 600; 
            }

            /* Table improvements */
            table { 
                width: 100%; 
                margin-top: 20px; 
                border-radius: 12px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
                background: white; 
            }
            th { 
                background: linear-gradient(135deg, #f1f5f9, #e2e8f0); 
                padding: 12px 8px; 
                text-align: left; 
                font-size: 12px; 
                font-weight: 700; 
                color: #374151; 
                text-transform: uppercase; 
                letter-spacing: 0.5px; 
            }
            td { 
                padding: 10px 8px; 
                border-bottom: 1px solid #f1f5f9; 
                font-size: 12px; 
                vertical-align: middle; 
            }
            tr:hover { background: #f8fafc; }
            tr[style*="background-color:#fef2f2"] { 
                background: linear-gradient(90deg, #fef2f2 0%, #fff 100%) !important; 
                border-left: 4px solid #dc2626; 
            }
            
            /* Enhanced table styles */
            .conversation-row.emergency-row { 
                background: linear-gradient(90deg, #fef2f2 0%, #fff 95%) !important; 
                border-left: 4px solid #dc2626; 
                position: relative;
            }
            .conversation-row.severe { background: rgba(220, 38, 38, 0.05); }
            .conversation-row.high { background: rgba(245, 158, 11, 0.05); }
            
            .emergency-indicator { 
                position: absolute; 
                right: 2px; 
                top: 50%; 
                transform: translateY(-50%); 
                animation: pulse 1.5s infinite; 
            }
            
            .transcript-status.available { 
                color: #059669; 
                font-weight: 600; 
                background: #dcfce7; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 10px; 
            }
            .transcript-status.missing { 
                color: #dc2626; 
                font-weight: 600; 
                background: #fee2e2; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 10px; 
            }
            
            .recording-link { 
                color: #059669; 
                text-decoration: none; 
                font-size: 16px; 
                transition: transform 0.2s; 
            }
            .recording-link:hover { transform: scale(1.2); }
            .recording-missing { color: #dc2626; }
            
            .ai-status.available { 
                color: #3b82f6; 
                font-size: 16px; 
            }
            .ai-status.missing { color: #dc2626; }
            
            .score-value { 
                font-weight: bold; 
                padding: 4px 8px; 
                border-radius: 50%; 
                color: white; 
                min-width: 24px; 
                display: inline-block; 
            }
            .score-value.high-score { background: #dc2626; }
            .score-value.medium-score { background: #f59e0b; }
            .score-value.low-score { background: #22c55e; }
            
            .action-buttons { display: flex; gap: 4px; }
            .action-btn { 
                background: none; 
                border: none; 
                font-size: 14px; 
                cursor: pointer; 
                padding: 4px; 
                border-radius: 4px; 
                transition: background 0.2s; 
                text-decoration: none; 
                color: inherit; 
            }
            .action-btn:hover { background: #f1f5f9; }
            .view-btn { color: #3b82f6; }
            .refresh-btn { color: #059669; }
            
            .text-center { text-align: center; }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .analytics-grid { grid-template-columns: 1fr; }
                table { font-size: 11px; }
                .actions { text-align: center; }
                .btn { display: block; width: 100%; margin: 5px 0; }
                .action-buttons { flex-direction: column; }
            }
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
        
        ${generateAnalyticsCards(conversations)}
        
        <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;min-width:1400px;">
            <thead>
                <tr>
                    <th>Call ID</th>
                    <th>Phone</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Transcript</th>
                    <th>🎵</th>
                    <th>Risk Level</th>
                    <th>Counselling</th>
                    <th>Score</th>
                    <th>🤖</th>
                    <th>Actions</th>
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