import { badge } from './dashboard.js';

/**
 * Generate conversation detail page HTML
 */
export function generateConversationDetailHTML(conversation) {
    const c = conversation;
    
    const geminiSection = c.geminiAnalysis ? `
    <h3>🤖 AI Analysis (Gemini)</h3>
    <div style="background:#f0fdf4;padding:15px;border-radius:8px;margin:10px 0;">
        <p><strong>Risk Level:</strong> <span class="badge ${c.geminiAnalysis.risk_level}">${c.geminiAnalysis.risk_level}</span></p>
        <p><strong>Counseling Needed:</strong> <span class="badge ${c.geminiAnalysis.counseling_needed}">${c.geminiAnalysis.counseling_needed}</span></p>
        ${c.geminiAnalysis.emotional_state ? `<p><strong>Emotional State:</strong> ${c.geminiAnalysis.emotional_state}</p>` : ''}
        ${c.geminiAnalysis.language_used ? `<p><strong>Language Used:</strong> ${c.geminiAnalysis.language_used}</p>` : ''}
        ${c.geminiAnalysis.immediate_intervention ? `<p><strong>Immediate Intervention:</strong> <span style="color:red;font-weight:bold;">${c.geminiAnalysis.immediate_intervention}</span></p>` : ''}
        ${c.geminiAnalysis.assessment_summary ? `<p><strong>Assessment:</strong> ${c.geminiAnalysis.assessment_summary}</p>` : ''}
        ${c.geminiAnalysis.concerning_phrases && c.geminiAnalysis.concerning_phrases.length > 0 ? `
            <p><strong>Concerning Phrases:</strong> ${c.geminiAnalysis.concerning_phrases.map(p => `<span style="background:#fee2e2;padding:2px 6px;border-radius:4px;margin:2px;">${p}</span>`).join(' ')}</p>
        ` : ''}
        ${c.geminiAnalysis.support_recommendations ? `<p><strong>Support Recommendations:</strong> ${c.geminiAnalysis.support_recommendations}</p>` : ''}
        ${c.geminiAnalysis.confidence_level ? `<p><strong>Confidence Level:</strong> ${c.geminiAnalysis.confidence_level}</p>` : ''}
    </div>` : '<h3>🤖 AI Analysis</h3><p style="color:#6b7280;">No AI analysis available</p>';

    const detectedTermsSection = c.detectedTerms && c.detectedTerms.length > 0 ? `
    <h3>🔍 Detected Terms</h3>
    <div style="margin:10px 0;">
        ${c.detectedTerms.map(term => `
            <span style="background:#${term.category === 'severe' ? 'fee2e2' : term.category === 'high' ? 'fef3c7' : term.category === 'medium' ? 'ddd6fe' : 'e5e7eb'};padding:4px 8px;border-radius:6px;margin:3px;display:inline-block;font-size:12px;">
                ${term.term} <em>(${term.category})</em>
            </span>
        `).join('')}
    </div>` : '';

    return `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Conversation ${c.id}</title>
        <style>
            .badge{display:inline-block;padding:2px 8px;border-radius:12px;color:#fff;font-size:12px}
            .no{background:#64748b}
            .low{background:#22c55e}
            .medium{background:#f59e0b}
            .high{background:#ef4444}
            .severe{background:#7f1d1d}
            .yes{background:#ef4444}
            .advised{background:#f59e0b}
            .btn{padding:8px 16px;margin:5px;border:none;border-radius:4px;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block;}
            .btn-primary{background:#3b82f6;color:white;}
            .btn-secondary{background:#6b7280;color:white;}
        </style>
    </head>
    <body style="margin:24px;font-family:sans-serif;">
        <div style="margin-bottom:20px;">
            <a href="/dashboard">← Back to Dashboard</a>
            <div style="float:right;">
                <button class="btn btn-primary" onclick="refreshConversation()">🔄 Refresh Transcript</button>
                <button class="btn btn-secondary" onclick="regenerateAIAnalysis()">🤖 Regenerate AI Analysis</button>
            </div>
        </div>
        
        <h2>Conversation Details</h2>
        
        <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <h3>📋 Basic Information</h3>
            <p><strong>Call ID:</strong> ${c.id}</p>
            <p><strong>From:</strong> ${c.from}</p>
            <p><strong>Created:</strong> ${new Date(c.createdAt).toLocaleString()}</p>
            <p><strong>Updated:</strong> ${new Date(c.updatedAt).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="badge ${c.status || 'unknown'}">${c.status || 'unknown'}</span></p>
            ${c.recordingUrl ? `<p><strong>Recording:</strong> <a href="${c.recordingUrl}" target="_blank" style="color:#059669;text-decoration:none;">🎵 Play Audio Recording</a></p>` : '<p><strong>Recording:</strong> <span style="color:#6b7280;">No recording available</span></p>'}
        </div>
        
        <div style="background:#f0f9ff;padding:20px;border-radius:8px;margin:20px 0;">
            <h3>🎯 Risk Assessment</h3>
            <p><strong>Risk Level:</strong> <span class="badge ${c.tendency}">${c.tendency}</span></p>
            <p><strong>Counselling Needed:</strong> <span class="badge ${c.needsCounselling}">${c.needsCounselling}</span></p>
            <p><strong>Risk Score:</strong> ${c.score || 0}</p>
            <p><strong>Immediate Intervention:</strong> ${c.immediateIntervention ? '🚨 <span style="color:red;font-weight:bold;">YES</span>' : 'No'}</p>
        </div>
        
        ${geminiSection}
        
        ${detectedTermsSection}
        
        <h3>📋 System Review</h3>
        <div style="background:#fffbeb;padding:15px;border-radius:8px;border-left:4px solid #f59e0b;">
            <p>${(c.summary || 'No system review available').replace(/</g, '&lt;')}</p>
        </div>
        
        <h3>📝 Transcript</h3>
        <div style="background:#f9fafb;padding:15px;border-radius:8px;border:1px solid #e5e7eb;">
            ${c.transcript && c.transcript.trim() ? 
                `<pre style="white-space:pre-wrap;margin:0;">${c.transcript.replace(/</g, '&lt;')}</pre>` :
                '<p style="color:#6b7280;font-style:italic;">No transcript available</p>'
            }
        </div>
        
        ${c.recordingUrl ? `
        <h3>🎵 Call Recording</h3>
        <div style="background:#f0f9ff;padding:20px;border-radius:8px;border:1px solid #dbeafe;margin:20px 0;">
            <div style="margin-bottom:10px;">
                <audio controls style="width:100%;max-width:500px;">
                    <source src="${c.recordingUrl}" type="audio/mpeg">
                    <source src="${c.recordingUrl}" type="audio/wav">
                    <source src="${c.recordingUrl}" type="audio/ogg">
                    Your browser does not support the audio element.
                </audio>
            </div>
            <p style="margin:5px 0;font-size:12px;color:#6b7280;">
                <strong>Direct link:</strong> <a href="${c.recordingUrl}" target="_blank" style="color:#059669;">${c.recordingUrl}</a>
            </p>
            <p style="margin:5px 0;font-size:12px;color:#6b7280;">
                💡 <em>Tip: Right-click the audio player and select "Download" to save the recording locally.</em>
            </p>
        </div>
        ` : ''}
        
        <h3>🔧 Raw Data</h3>
        <details style="margin:20px 0;">
            <summary style="cursor:pointer;padding:10px;background:#f3f4f6;border-radius:4px;">Show Raw Data</summary>
            <pre style="white-space:pre-wrap;font-size:12px;background:#f9fafb;padding:15px;border-radius:8px;margin-top:10px;overflow:auto;">${JSON.stringify(c.raw || {}, null, 2).replace(/</g, '&lt;')}</pre>
        </details>
        
        <div id="result" style="margin-top:20px;"></div>
        
        <script>
            async function refreshConversation() {
                try {
                    document.getElementById('result').innerHTML = '<div style="color:#3b82f6;">⏳ Refreshing transcript and analysis...</div>';
                    const response = await fetch(\`/api/conversations/${encodeURIComponent(c.id)}/refresh\`, { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const result = await response.json();
                    
                    if (result.ok) {
                        document.getElementById('result').innerHTML = \`<div style="color:green;padding:10px;background:#f0fdf4;border-radius:4px;">✅ \${result.message}</div>\`;
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        document.getElementById('result').innerHTML = \`<div style="color:red;padding:10px;background:#fef2f2;border-radius:4px;">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = \`<div style="color:red;padding:10px;background:#fef2f2;border-radius:4px;">❌ Error: \${error.message}</div>\`;
                }
            }

            async function regenerateAIAnalysis() {
                try {
                    document.getElementById('result').innerHTML = '<div style="color:#3b82f6;">🤖 Regenerating AI analysis... This may take a moment.</div>';
                    const response = await fetch(\`/api/conversations/${encodeURIComponent(c.id)}/regenerate-analysis\`, { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const result = await response.json();
                    
                    if (result.ok) {
                        document.getElementById('result').innerHTML = \`<div style="color:green;padding:10px;background:#f0fdf4;border-radius:4px;">✅ \${result.message}</div>\`;
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        document.getElementById('result').innerHTML = \`<div style="color:red;padding:10px;background:#fef2f2;border-radius:4px;">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = \`<div style="color:red;padding:10px;background:#fef2f2;border-radius:4px;">❌ Error: \${error.message}</div>\`;
                }
            }
        </script>
    </body>
    </html>`;
}