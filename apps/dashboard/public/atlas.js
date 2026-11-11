(function (window, document) {
  'use strict';

  class Atlas {
    constructor(options = {}) {
      this.key = options.key || options.publicKey || '';
      this.email = options.email || options.customerEmail || '';
      this.amount = options.amount || 0;
      this.currency = (options.currency || 'GHS').toUpperCase();
      this.reference = options.reference || options.ref || 'atl_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
      this.name = options.name || options.customerName || '';
      this.phone = options.phone || options.customerPhone || '';
      this.channels = options.channels || ['mobile_money', 'card', 'bank_transfer'];
      this.metadata = options.metadata || {};
      this.onSuccess = typeof options.onSuccess === 'function' ? options.onSuccess : function () {};
      this.onCancel = typeof options.onCancel === 'function' ? options.onCancel : function () {};
      this.onClose = typeof options.onClose === 'function' ? options.onClose : this.onCancel;
      
      // Default to deployed production dashboard or local origin
      if (options.host) {
        this.host = options.host.replace(/\/$/, '');
      } else if (typeof window !== 'undefined' && window.location && window.location.origin.includes('localhost')) {
        this.host = window.location.origin;
      } else {
        this.host = 'https://atlas-gamma-bay.vercel.app';
      }

      this._overlay = null;
      this._iframe = null;
      this._boundMessageHandler = null;
      this._boundKeyHandler = null;
    }

    open() {
      if (!this.key) {
        console.error('[ATLAS] Missing public key. Please initialize with: new Atlas({ key: "pk_test_..." })');
        alert('ATLAS Error: Missing public key (pk_test_...)');
        return;
      }

      this._cleanup();

      const params = new URLSearchParams({
        key: this.key,
        email: this.email,
        amount: this.amount.toString(),
        currency: this.currency,
        ref: this.reference,
        name: this.name,
        phone: this.phone,
        channels: Array.isArray(this.channels) ? this.channels.join(',') : 'mobile_money,card',
        origin: typeof window !== 'undefined' ? window.location.origin : ''
      });

      const checkoutUrl = `${this.host}/pay/inline?${params.toString()}`;

      const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 640 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'atlas-checkout-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(11, 31, 58, ${isMobile ? '0.85' : '0.7'});
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: ${isMobile ? 'flex-end' : 'center'};
        justify-content: center;
        z-index: 2147483647;
        opacity: 0;
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        padding: ${isMobile ? '0' : '16px'};
        box-sizing: border-box;
      `;

      const frameWrapper = document.createElement('div');
      frameWrapper.style.cssText = `
        position: relative;
        width: 100%;
        max-width: ${isMobile ? '100%' : '440px'};
        height: ${isMobile ? '92vh' : '640px'};
        max-height: ${isMobile ? '92vh' : '94vh'};
        background: #ffffff;
        border-radius: ${isMobile ? '24px 24px 0 0' : '24px'};
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        overflow: hidden;
        transform: ${isMobile ? 'translateY(100%)' : 'scale(0.95) translateY(12px)'};
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Close checkout');
      closeBtn.style.cssText = `
        position: absolute;
        top: 14px;
        right: 14px;
        width: 32px;
        height: 32px;
        background: #f1f5f9;
        border: none;
        border-radius: 50%;
        font-size: 22px;
        line-height: 1;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
        transition: all 0.15s ease;
      `;
      closeBtn.onmouseenter = () => { closeBtn.style.background = '#e2e8f0'; closeBtn.style.color = '#0f172a'; };
      closeBtn.onmouseleave = () => { closeBtn.style.background = '#f1f5f9'; closeBtn.style.color = '#64748b'; };
      closeBtn.onclick = () => {
        this.close();
        this.onClose();
      };

      const iframe = document.createElement('iframe');
      iframe.src = checkoutUrl;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        flex: 1;
        background: #ffffff;
      `;
      iframe.setAttribute('allow', 'payment');

      frameWrapper.appendChild(closeBtn);
      frameWrapper.appendChild(iframe);
      overlay.appendChild(frameWrapper);
      document.body.appendChild(overlay);

      this._overlay = overlay;
      this._iframe = iframe;

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        frameWrapper.style.transform = isMobile ? 'translateY(0)' : 'scale(1) translateY(0)';
      });

      this._boundMessageHandler = (e) => {
        if (!e.data || typeof e.data !== 'object') return;
        if (e.data.type === 'ATLAS_PAYMENT_SUCCESS') {
          this.close();
          this.onSuccess(e.data.data);
        } else if (e.data.type === 'ATLAS_PAYMENT_CANCEL') {
          this.close();
          this.onCancel();
        }
      };
      window.addEventListener('message', this._boundMessageHandler);

      this._boundKeyHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
          this.onClose();
        }
      };
      window.addEventListener('keydown', this._boundKeyHandler);
    }

    close() {
      if (!this._overlay) return;
      this._overlay.style.opacity = '0';
      const frameWrapper = this._overlay.firstElementChild;
      if (frameWrapper) {
        frameWrapper.style.transform = 'scale(0.95) translateY(12px)';
      }
      setTimeout(() => {
        this._cleanup();
      }, 250);
    }

    _cleanup() {
      if (this._boundMessageHandler) {
        window.removeEventListener('message', this._boundMessageHandler);
        this._boundMessageHandler = null;
      }
      if (this._boundKeyHandler) {
        window.removeEventListener('keydown', this._boundKeyHandler);
        this._boundKeyHandler = null;
      }
      const existing = document.getElementById('atlas-checkout-overlay');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      this._overlay = null;
      this._iframe = null;
    }
  }

  window.Atlas = Atlas;
  window.AtlasCheckout = Atlas;
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
