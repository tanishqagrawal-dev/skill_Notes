window.renderQrGenerator = function() {
    return `
    <div id="qr-generator" class="tab-pane active fade-in" style="width: 100%;">
        <div class="qr-two-col" style="margin-top: 2rem;">
            <!-- LEFT: Controls -->
            <div class="qr-left-panel">
                <div class="qr-panel-label">QR Code Generator</div>
                <p class="qr-panel-sub">Convert any live link into a stunning, scannable QR code instantly.</p>

                <label class="qr-field-label">Enter URL</label>
                <div class="qr-input-group">
                    <input type="url" id="qr-url-input" placeholder="https://skilmatrix.site/" autocomplete="off" />
                    <button id="qr-generate-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                        Generate
                    </button>
                </div>

                <div class="qr-divider"></div>

                <div class="qr-customization">
                    <div class="qr-cust-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                        Customization
                    </div>
                <div class="qr-custom-grid">
                    <div class="qr-option">
                        <label>Color Theme</label>
                        <div class="custom-select" id="custom-color-select" data-value="#ffffff">
                            <div class="select-selected">⚪ Pure White</div>
                            <div class="select-items select-hide">
                                <div data-value="#ffffff">⚪ Pure White</div>
                                <div data-value="#7c6aef">💜 Premium Purple</div>
                                <div data-value="#4ecdc4">🩵 Glowing Cyan</div>
                                <div data-value="#ff6b6b">❤️ Neon Pink</div>
                                <div data-value="#ffd93d">💛 Golden Yellow</div>
                            </div>
                        </div>
                    </div>
                    <div class="qr-option">
                        <label>Dot Style</label>
                        <div class="custom-select" id="custom-dot-select" data-value="rounded">
                            <div class="select-selected">Rounded</div>
                            <div class="select-items select-hide">
                                <div data-value="rounded">Rounded</div>
                                <div data-value="dots">Circle Dots</div>
                                <div data-value="classy">Classy</div>
                                <div data-value="classy-rounded">Classy Rounded</div>
                                <div data-value="square">Square</div>
                                <div data-value="extra-rounded">Extra Rounded</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            <!-- RIGHT: Preview + Actions -->
            <div class="qr-right-panel" style="border-radius: 20px;">
                <div class="qr-panel-label">Preview</div>
                <div id="qr-code-canvas-container">
                    <div class="qr-placeholder">
                        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8">
                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                            <rect x="5" y="5" width="3" height="3" rx="0.5" fill="white" stroke="none"/><rect x="16" y="5" width="3" height="3" rx="0.5" fill="white" stroke="none"/><rect x="16" y="16" width="3" height="3" rx="0.5" fill="white" stroke="none"/><rect x="5" y="16" width="3" height="3" rx="0.5" fill="white" stroke="none"/>
                        </svg>
                        <span>Your QR will<br>appear here</span>
                    </div>
                </div>

                <div class="qr-action-buttons" id="qr-action-buttons" style="display: none;">
                    <button id="qr-download-btn" class="qr-action-btn qr-btn-download">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download PNG
                    </button>
                    <div class="qr-btn-row">
                        <button id="qr-share-btn" class="qr-action-btn qr-btn-share">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            Share
                        </button>
                        <button id="qr-save-btn" class="qr-action-btn qr-btn-save">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

window.initQrGenerator = function() {
    const qrGenerateBtn = document.getElementById('qr-generate-btn');
    const qrUrlInput = document.getElementById('qr-url-input');
    const qrCanvasContainer = document.getElementById('qr-code-canvas-container');
    const qrActionButtons = document.getElementById('qr-action-buttons');
    const qrAdvancedToggle = document.getElementById('qr-advanced-toggle');
    const qrDownloadBtn = document.getElementById('qr-download-btn');
    const qrShareBtn = document.getElementById('qr-share-btn');
    const qrSaveBtn = document.getElementById('qr-save-btn');
    const customColorSelect = document.getElementById('custom-color-select');
    const customDotSelect = document.getElementById('custom-dot-select');

    // Custom Select Dropdown Logic
    function setupCustomSelect(selectElement, onChangeCallback) {
        if (!selectElement) return;
        const selectedDiv = selectElement.querySelector('.select-selected');
        const itemsDiv = selectElement.querySelector('.select-items');
        const options = itemsDiv.querySelectorAll('div');

        // Remove old listeners to avoid duplicates if re-inited
        const newSelectedDiv = selectedDiv.cloneNode(true);
        selectedDiv.parentNode.replaceChild(newSelectedDiv, selectedDiv);

        newSelectedDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            itemsDiv.classList.toggle('select-hide');
            this.classList.toggle('select-arrow-active');
        });

        options.forEach(option => {
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            newOption.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.getAttribute('data-value');
                const text = this.innerHTML;
                newSelectedDiv.innerHTML = text;
                selectElement.setAttribute('data-value', value);
                itemsDiv.classList.add('select-hide');
                newSelectedDiv.classList.remove('select-arrow-active');
                
                // Update selected styling
                itemsDiv.querySelectorAll('div').forEach(opt => opt.classList.remove('same-as-selected'));
                this.classList.add('same-as-selected');
                
                if(onChangeCallback) onChangeCallback();
            });
        });
    }

    function closeAllSelect(exceptEl) {
        document.querySelectorAll('.select-items').forEach(el => {
            if (el.previousElementSibling !== exceptEl) {
                el.classList.add('select-hide');
                el.previousElementSibling.classList.remove('select-arrow-active');
            }
        });
    }
    
    // We bind to document just once globally
    if (!window.qrSelectBound) {
        document.addEventListener('click', closeAllSelect);
        window.qrSelectBound = true;
    }

    let currentQrCode = null;

    if (qrGenerateBtn) {
        // Auto-generate initial QR code so it's ready
        setTimeout(() => {
            qrGenerateBtn.click();
        }, 500);

        qrGenerateBtn.addEventListener('click', async () => {
            let urlStr = qrUrlInput.value.trim();
            if (!urlStr) {
                urlStr = qrUrlInput.placeholder || 'https://skilmatrix.site/';
            }
            
            // Basic URL validation/correction
            let finalUrl = urlStr;
            if (!/^https?:\/\//i.test(finalUrl)) {
                finalUrl = 'https://' + finalUrl;
            }

            let hostname = '';
            try {
                const urlObj = new URL(finalUrl);
                hostname = urlObj.hostname;
            } catch(e) {
                alert('Invalid URL format.');
                return;
            }

            // Show ultra premium futuristic loader
            qrCanvasContainer.classList.remove('has-qr');
            qrCanvasContainer.innerHTML = '<div class="futuristic-loader"></div>';

            // Ensure QRCodeStyling is loaded
            if (typeof QRCodeStyling === 'undefined') {
                qrCanvasContainer.innerHTML = '<div style="color:red;">Library failed to load.</div>';
                return;
            }

            let iconUrl = '';
            
            // Custom premium fallback for local/own domain
            if (hostname.toLowerCase().includes('aurex') || hostname.toLowerCase().includes('skilmatrix') || hostname === 'localhost') {
                const firstLetter = hostname.toLowerCase().includes('aurex') ? 'A' : 'S';
                iconUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c6aef"/><stop offset="100%" stop-color="%234ecdc4"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="%23090514" stroke="url(%23g)" stroke-width="4"/><text x="50" y="72" font-family="sans-serif" font-weight="900" font-size="65" fill="url(%23g)" text-anchor="middle">${firstLetter}</text></svg>`;
            } else {
                // Use unavatar.io natively - it has built-in CORS support and is ultra-fast!
                let displayHost = hostname.replace(/^www\./i, '');
                let firstLetter = displayHost.charAt(0).toUpperCase();
                if (!firstLetter || !/[A-Z]/.test(firstLetter)) firstLetter = 'Q';
                
                // Fallback SVG if unavatar cannot find the real one
                let fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c6aef"/><stop offset="100%" stop-color="%234ecdc4"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="%23090514" stroke="url(%23g)" stroke-width="4"/><text x="50" y="72" font-family="sans-serif" font-weight="900" font-size="65" fill="url(%23g)" text-anchor="middle">${firstLetter}</text></svg>`;
                
                iconUrl = `https://unavatar.io/${hostname}?fallback=${encodeURIComponent(fallbackSvg)}`;
            }
            
            const dotColor = customColorSelect ? customColorSelect.getAttribute('data-value') : "#ffffff";
            const dotType = customDotSelect ? customDotSelect.getAttribute('data-value') : "rounded";

            // Generate instantly without artificial delays
            try {
                currentQrCode = new QRCodeStyling({
                    width: 250,
                    height: 250,
                    margin: 20,
                    qrOptions: { errorCorrectionLevel: 'H' },
                    type: "svg",
                    data: finalUrl,
                    image: iconUrl,
                    dotsOptions: {
                        color: dotColor,
                        type: dotType
                    },
                    cornersSquareOptions: {
                        type: "extra-rounded",
                        color: dotColor
                    },
                    cornersDotOptions: {
                        type: "dot",
                        color: dotColor
                    },
                    backgroundOptions: {
                        color: "#090514",
                    },
                    imageOptions: {
                        crossOrigin: "anonymous",
                        margin: 10
                    }
                });

                qrCanvasContainer.innerHTML = ''; // Clear loader
                currentQrCode.append(qrCanvasContainer);
                qrCanvasContainer.classList.add('has-qr');
                if (qrActionButtons) qrActionButtons.style.display = 'flex';
            } catch(error) {
                console.error("QR Code Generation Error:", error);
                qrCanvasContainer.innerHTML = '<div style="color:red;">Failed to generate QR Code.</div>';
            }
        });

        // Advanced features toggle
        if (qrAdvancedToggle) {
            qrAdvancedToggle.addEventListener('click', function() {
                this.parentElement.classList.toggle('open');
            });
        }

        // Real-time UI updates for styling
        const updateQrStyle = () => {
            if (currentQrCode) {
                const newColor = customColorSelect ? customColorSelect.getAttribute('data-value') : "#ffffff";
                const newType = customDotSelect ? customDotSelect.getAttribute('data-value') : "rounded";
                currentQrCode.update({
                    dotsOptions: {
                        color: newColor,
                        type: newType
                    },
                    cornersSquareOptions: {
                        color: newColor
                    },
                    cornersDotOptions: {
                        color: newColor
                    }
                });
            }
        };
        
        setupCustomSelect(customColorSelect, updateQrStyle);
        setupCustomSelect(customDotSelect, updateQrStyle);

        // Action Buttons Logic
        if (qrDownloadBtn) {
            qrDownloadBtn.addEventListener('click', async () => {
                if (currentQrCode) {
                    currentQrCode.update({ width: 1200, height: 1200, margin: 60 });
                    await currentQrCode.download({ extension: "png", name: "SKiL_MATRiX_QR" });
                    setTimeout(() => currentQrCode.update({ width: 250, height: 250, margin: 20 }), 200);
                }
            });
        }

        if (qrShareBtn) {
            qrShareBtn.addEventListener('click', async () => {
                let shareData = {
                    title: 'My QR Code',
                    text: 'Generated securely with SKiL Matrix',
                    url: qrUrlInput.value.trim() || 'https://skilmatrix.com'
                };

                try {
                    // Try to extract the QR code image blob for sharing
                    if (currentQrCode) {
                        currentQrCode.update({ width: 1200, height: 1200, margin: 60 });
                        const blob = await currentQrCode.getRawData("png");
                        setTimeout(() => currentQrCode.update({ width: 250, height: 250, margin: 20 }), 200);
                        
                        if (blob) {
                            const file = new File([blob], "skilmatrix_qr.png", { type: "image/png" });
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                shareData.files = [file];
                            }
                        }
                    }

                    if (navigator.share) {
                        await navigator.share(shareData);
                    } else {
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Check out my QR Code: ' + shareData.url)}`;
                        window.open(whatsappUrl, '_blank');
                    }
                } catch (e) {
                    console.error('Share failed', e);
                    if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Check out my QR Code: ' + shareData.url)}`;
                        window.open(whatsappUrl, '_blank');
                    }
                }
            });
        }

        if (qrSaveBtn) {
            qrSaveBtn.addEventListener('click', () => {
                const url = qrUrlInput.value.trim() || 'https://skilmatrix.com';
                let savedQRs = JSON.parse(localStorage.getItem('skilmatrix_saved_qrcodes') || '[]');
                
                if (savedQRs.includes(url)) {
                    alert('💎 Premium Feature:\nThis QR Code is already securely saved in your Premium History! You do not need to save it again.');
                } else {
                    savedQRs.push(url);
                    localStorage.setItem('skilmatrix_saved_qrcodes', JSON.stringify(savedQRs));
                    alert('✅ QR Code successfully saved to your secure History! (Premium Feature)');
                }
            });
        }
    }
};
