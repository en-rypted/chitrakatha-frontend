import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Documentation = () => {
    const [agentReadme, setAgentReadme] = useState('Loading Agent Docs...');
    const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'site'

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/en-rypted/chitrakatha_agent/main/README.md')
            .then(res => res.text())
            .then(text => setAgentReadme(text))
            .catch(err => setAgentReadme("Failed to load Agent documentation. Check your internet connection."));
    }, []);

    const siteGuide = `
# How to Use Chitrakatha

## 🌐 Browser P2P Mode
**Best for:** Small files, quick sharing, no setup.
1.  **Add a File**: Click "Select File".
2.  **Wait for Peers**: Ensure your friend is in the room.
3.  **Transfer**: The file streams directly between browsers.

## 🚀 Local Agent Mode (Recommended)
**Best for:** Large movies (MKV/MP4), high-speed LAN, instant playback.
1.  **Install Agent**: Download the agent from the "Local Agent" tab.
2.  **Run Agent**: Double-click \`chitrakatha_agent.exe\`.
3.  **Select & Play**: Host selects a file from disk -> Viewers click "Download & Play".

## 🐛 Troubleshooting
- **Video not playing?** Try using Local Agent mode for better format support.
- **Connection failed?** Ensure you are on the same Wi-Fi network for optimal performace.
    `;

    return (
        <div className="documentation-container" style={{ textAlign: 'left', padding: '30px' }}>

            {/* Sub-Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0' }}>
                <button
                    onClick={() => setActiveTab('site')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'site' ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        borderBottom: activeTab === 'site' ? '2px solid var(--primary)' : 'none'
                    }}
                >
                    Site Guide
                </button>
                <button
                    onClick={() => setActiveTab('agent')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'agent' ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        borderBottom: activeTab === 'agent' ? '2px solid var(--primary)' : 'none'
                    }}
                >
                    Agent Docs (GitHub)
                </button>
            </div>

            {/* Content Area */}
            <div className="markdown-body" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '10px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeTab === 'agent' ? agentReadme : siteGuide}
                </ReactMarkdown>
            </div>

            <style>{`
                .markdown-body {
                    color: var(--text-main);
                    font-size: 0.9rem;
                    line-height: 1.6;
                }
                .markdown-body h1, .markdown-body h2 {
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 0.3em;
                    color: var(--secondary);
                    margin-top: 0 !important;
                    padding-top: 0 !important;
                }
                .markdown-body code {
                    background: rgba(0,0,0,0.3);
                    padding: 2px 5px;
                    border-radius: 4px;
                    font-family: monospace;
                    color: #ff9800;
                }
                .markdown-body pre {
                    background: rgba(0,0,0,0.3);
                    padding: 10px;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                .markdown-body a {
                    color: var(--primary);
                }
                .markdown-body ul {
                    padding-left: 20px;
                }
            `}</style>
        </div>
    );
};

export default Documentation;
