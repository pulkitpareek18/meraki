import { badge } from './dashboard.js';

/**
 * Generate conversation timeline for better visualization
 */
function generateTimelineView(conversation) {
    const events = [];
    
    // Add creation event
    events.push({
        timestamp: conversation.createdAt,
        type: 'call_started',
        title: 'Call Started',
        description: `Incoming call from ${conversation.from}`,
        icon: '📞'
    });
    
    // Add transcript event if available
    if (conversation.transcript) {
        events.push({
            timestamp: conversation.updatedAt,
            type: 'transcript_available',
            title: 'Transcript Generated',
            description: `${conversation.transcript.length} characters transcribed`,
            icon: '📝'
        });
    }
    
    // Add AI analysis event if available
    if (conversation.geminiAnalysis && !conversation.geminiAnalysis.error) {
        events.push({
            timestamp: conversation.updatedAt,
            type: 'ai_analysis',
            title: 'AI Analysis Completed',
            description: `Risk level: ${conversation.geminiAnalysis.risk_level}`,
            icon: '🤖'
        });
    }
    
    // Add emergency alert if applicable
    if (conversation.immediateIntervention) {
        events.push({
            timestamp: conversation.updatedAt,
            type: 'emergency_alert',
            title: 'Emergency Alert Triggered',
            description: 'Immediate intervention may be required',
            icon: '🚨'
        });
    }
    
    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return `
    <div class="timeline-container">
        <h3>📋 Call Timeline</h3>
        <div class="timeline">
            ${events.map(event => `
                <div class="timeline-item ${event.type}">
                    <div class="timeline-icon">${event.icon}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${event.title}</div>
                        <div class="timeline-description">${event.description}</div>
                        <div class="timeline-time">${new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

/**
 * Generate enhanced risk assessment section
 */
function generateRiskAssessmentSection(conversation) {
    const riskColors = {
        'no': '#22c55e',
        'low': '#22c55e',
        'medium': '#f59e0b',
        'high': '#ef4444',
        'severe': '#7f1d1d'
    };
    
    const riskColor = riskColors[conversation.tendency] || '#6b7280';
    const riskPercentage = Math.min(((conversation.score || 0) / 10) * 100, 100);
    
    return `
    <div class="risk-assessment-enhanced">
        <h3>🎯 Risk Assessment Overview</h3>
        <div class="risk-meter">
            <div class="risk-meter-label">Risk Score: ${conversation.score || 0}/10</div>
            <div class="risk-meter-bar">
                <div class="risk-meter-fill" style="width: ${riskPercentage}%; background-color: ${riskColor};"></div>
            </div>
            <div class="risk-meter-labels">
                <span>No Risk</span>
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Severe</span>
            </div>
        </div>
        
        <div class="risk-details-grid">
            <div class="risk-detail-card">
                <div class="risk-detail-label">Risk Level</div>
                <div class="risk-detail-value">${badge(conversation.tendency)}</div>
            </div>
            <div class="risk-detail-card">
                <div class="risk-detail-label">Counselling Needed</div>
                <div class="risk-detail-value">${badge(conversation.needsCounselling)}</div>
            </div>
            <div class="risk-detail-card">
                <div class="risk-detail-label">Immediate Action</div>
                <div class="risk-detail-value">${conversation.immediateIntervention ? '🚨 <span style="color:red;font-weight:bold;">YES</span>' : '✅ No'}</div>
            </div>
        </div>
        
        ${conversation.detectedTerms && conversation.detectedTerms.length > 0 ? `
            <div class="detected-terms-section">
                <h4>🔍 Detected Risk Indicators</h4>
                <div class="detected-terms-grid">
                    ${conversation.detectedTerms.map(term => `
                        <span class="detected-term ${term.category}">
                            ${term.term} <em>(${term.category})</em>
                        </span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    </div>
    `;
}

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
            /* Reset and base styles */
            * { box-sizing: border-box; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; line-height: 1.6; }
            
            /* Badge styles */
            .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 20px; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .no { background: linear-gradient(135deg, #64748b, #475569); }
            .low { background: linear-gradient(135deg, #22c55e, #16a34a); }
            .medium { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .high { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .severe { background: linear-gradient(135deg, #7f1d1d, #991b1b); box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }
            .yes { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .advised { background: linear-gradient(135deg, #f59e0b, #d97706); }
            
            /* Button styles */
            .btn { padding: 10px 16px; margin: 5px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; transition: all 0.2s ease; }
            .btn:hover { transform: translateY(-1px); }
            .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
            .btn-primary:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); box-shadow: 0 6px 12px -1px rgba(59, 130, 246, 0.4); }
            .btn-secondary { background: linear-gradient(135deg, #6b7280, #4b5563); color: white; box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3); }
            .btn-secondary:hover { background: linear-gradient(135deg, #4b5563, #374151); }
            
            /* Layout improvements */
            .main-content { max-width: 1200px; margin: 0 auto; padding: 24px; }
            .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .action-buttons { display: flex; gap: 10px; }
            
            /* Timeline styles */
            .timeline-container { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .timeline { position: relative; padding-left: 30px; }
            .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e5e7eb; }
            .timeline-item { position: relative; margin-bottom: 20px; }
            .timeline-icon { position: absolute; left: -22px; top: 0; width: 30px; height: 30px; background: white; border: 2px solid #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
            .timeline-item.emergency_alert .timeline-icon { border-color: #dc2626; background: #fef2f2; animation: pulse 2s infinite; }
            .timeline-item.ai_analysis .timeline-icon { border-color: #3b82f6; background: #eff6ff; }
            .timeline-content { background: #f9fafb; padding: 15px; border-radius: 8px; margin-left: 20px; }
            .timeline-title { font-weight: 600; color: #374151; margin-bottom: 5px; }
            .timeline-description { color: #6b7280; font-size: 14px; margin-bottom: 5px; }
            .timeline-time { font-size: 12px; color: #9ca3af; }
            
            /* Enhanced risk assessment */
            .risk-assessment-enhanced { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .risk-meter { margin: 20px 0; }
            .risk-meter-label { font-weight: 600; margin-bottom: 10px; }
            .risk-meter-bar { height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; position: relative; }
            .risk-meter-fill { height: 100%; transition: width 1s ease-in-out; border-radius: 10px; }
            .risk-meter-labels { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-top: 5px; }
            
            .risk-details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .risk-detail-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
            .risk-detail-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            .risk-detail-value { font-weight: 600; }
            
            .detected-terms-section { margin-top: 20px; }
            .detected-terms-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .detected-term { padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
            .detected-term.critical_severe { background: #fee2e2; color: #7f1d1d; }
            .detected-term.severe_plan { background: #fef3c7; color: #92400e; }
            .detected-term.high { background: #ddd6fe; color: #5b21b6; }
            .detected-term.medium { background: #e0e7ff; color: #3730a3; }
            .detected-term.low { background: #e5e7eb; color: #374151; }
            
            /* Section styling */
            .info-section { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .info-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #e5e7eb; }
            .info-card.basic { border-left-color: #3b82f6; }
            .info-card.ai { border-left-color: #10b981; }
            .info-card.transcript { border-left-color: #f59e0b; }
            
            /* Audio player styling */
            .audio-section { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; border: 1px solid #bae6fd; margin: 20px 0; }
            audio { width: 100%; max-width: 500px; margin: 10px 0; }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .header-section { flex-direction: column; gap: 15px; }
                .action-buttons { width: 100%; }
                .btn { width: 100%; }
                .risk-details-grid { grid-template-columns: 1fr; }
                .info-grid { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="main-content">
            <div class="header-section">
                <div>
                    <a href="/dashboard" class="btn btn-secondary">← Back to Dashboard</a>
                    <h2 style="margin: 10px 0 0 0;">Conversation Details - ${c.id.substring(0, 12)}</h2>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="refreshConversation()">🔄 Refresh Data</button>
                    <button class="btn btn-secondary" onclick="regenerateAIAnalysis()">🤖 Regenerate Analysis</button>
                </div>
            </div>
            
            ${generateTimelineView(c)}
            
            <div class="info-grid">
                <div class="info-section">
                    <div class="info-card basic">
                        <h3>📋 Call Information</h3>
                        <p><strong>Call ID:</strong> ${c.id}</p>
                        <p><strong>Phone:</strong> ${c.from}</p>
                        <p><strong>Started:</strong> ${new Date(c.createdAt).toLocaleString()}</p>
                        <p><strong>Last Updated:</strong> ${new Date(c.updatedAt).toLocaleString()}</p>
                        <p><strong>Status:</strong> ${badge(c.status || 'unknown')}</p>
                        <p><strong>Duration:</strong> ${Math.round((new Date(c.updatedAt) - new Date(c.createdAt)) / (1000 * 60))} minutes</p>
                    </div>
                </div>
                
                <div class="info-section">
                    ${generateRiskAssessmentSection(c)}
                </div>
            </div>
        
        ${geminiSection}
        
            <div class="info-section">
                <div class="info-card transcript">
                    <h3>� Call Transcript</h3>
                    ${c.transcript && c.transcript.trim() ? `
                        <div style="background:#f9fafb;padding:15px;border-radius:8px;border:1px solid #e5e7eb;margin-top:15px;">
                            <div style="margin-bottom:10px;display:flex;justify-content:between;align-items:center;">
                                <span style="font-size:12px;color:#6b7280;">Length: ${c.transcript.length} characters</span>
                                <button onclick="copyToClipboard('${c.transcript.replace(/'/g, "\\'")}', this)" style="background:#3b82f6;color:white;border:none;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;">Copy</button>
                            </div>
                            <pre style="white-space:pre-wrap;margin:0;font-size:13px;line-height:1.5;">${c.transcript.replace(/</g, '&lt;')}</pre>
                        </div>
                    ` : `
                        <div style="background:#fef2f2;padding:15px;border-radius:8px;border:1px solid #fecaca;margin-top:15px;text-align:center;">
                            <p style="color:#dc2626;font-style:italic;margin:0;">❌ No transcript available</p>
                            <button class="btn btn-primary" onclick="refreshConversation()" style="margin-top:10px;font-size:12px;">🔄 Try to fetch transcript</button>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="info-section">
                <div class="info-card ai">
                    <h3>📋 System Analysis Summary</h3>
                    <div style="background:#fffbeb;padding:15px;border-radius:8px;border-left:4px solid #f59e0b;margin-top:15px;">
                        <p style="margin:0;">${(c.summary || 'No system analysis available').replace(/</g, '&lt;')}</p>
                    </div>
                </div>
            </div>
        
            ${c.recordingUrl ? `
            <div class="audio-section">
                <h3>🎵 Call Recording</h3>
                <div style="margin-bottom:15px;">
                    <audio controls preload="metadata">
                        <source src="${c.recordingUrl}" type="audio/mpeg">
                        <source src="${c.recordingUrl}" type="audio/wav">
                        <source src="${c.recordingUrl}" type="audio/ogg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                <p style="margin:5px 0;font-size:12px;color:#6b7280;">
                    <strong>Recording URL:</strong> <a href="${c.recordingUrl}" target="_blank" style="color:#059669;">${c.recordingUrl}</a>
                </p>
                <p style="margin:5px 0;font-size:12px;color:#6b7280;">
                    💡 <em>Tip: Right-click the audio player and select "Download" to save locally.</em>
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
            
            function copyToClipboard(text, button) {
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = button.textContent;
                    button.textContent = '✅ Copied!';
                    button.style.background = '#059669';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.background = '#3b82f6';
                    }, 2000);
                }).catch(() => {
                    button.textContent = '❌ Failed';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
            }
        </script>
        </div>
    </body>
    </html>`;
}