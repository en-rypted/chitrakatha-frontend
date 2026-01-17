import React, { useState } from 'react';

const PasswordModal = ({ isOpen, onSubmit, onCancel, isLoading, isError }) => {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="animate-fade-in" style={{
                background: 'var(--glass)',
                padding: '30px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>Authentication Required</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>
                    This room is protected. Please enter the access password.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Enter password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(0,0,0,0.3)',
                            border: isError ? '1px solid #ff1744' : '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1.1rem',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}
                    />

                    {isError && (
                        <p className="animate-fade-in" style={{ color: '#ff1744', margin: '-10px 0 15px 0', fontSize: '0.9rem' }}>
                            ⛔ Incorrect password
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--text-muted)',
                                color: 'var(--text-muted)',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="primary-btn"
                            style={{
                                minWidth: '120px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? (
                                <span className="loader" style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid #000',
                                    borderBottomColor: 'transparent',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 1s linear infinite'
                                }}></span>
                            ) : 'Unlock 🔓'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PasswordModal;
