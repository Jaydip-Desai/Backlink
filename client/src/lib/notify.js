import React from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

/**
 * LinkPilot Notification & Alert System powered by React-Toastify
 */

const getThemeColors = () => ({
  background: '#ffffff',
  color: '#0f172a',
  subColor: '#475569',
  border: '#e2e8f0',
});

const ICON_COLORS = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#635bff',
};

const LinkPilotModalSwal = Swal.mixin({
  didOpen: popup => {
    const theme = getThemeColors();
    popup.style.backgroundColor = theme.background;
    popup.style.color = theme.color;
    popup.style.borderRadius = '16px';
    popup.style.boxShadow = '0 20px 50px -10px rgba(0, 0, 0, 0.35)';
    popup.style.border = `1px solid ${theme.border}`;
  },
  didClose: () => {
    document.body.classList.remove('swal2-shown', 'swal2-height-auto');
    document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto');
    document.body.style.overflow = '';
  },
  allowOutsideClick: true,
  allowEscapeKey: true,
  showCloseButton: true,
  customClass: {
    popup: 'linkpilot-swal-popup',
    title: 'linkpilot-swal-title',
    htmlContainer: 'linkpilot-swal-text',
    confirmButton: 'linkpilot-swal-btn linkpilot-swal-confirm',
    cancelButton: 'linkpilot-swal-btn linkpilot-swal-cancel',
    closeButton: 'linkpilot-swal-close',
    actions: 'linkpilot-swal-actions',
    timerProgressBar: 'linkpilot-swal-progress',
  },
  buttonsStyling: false,
  reverseButtons: true,
});

let activeLoadingToastId = null;

function formatToastContent(title, text = '') {
  const cleanText =
    typeof text === 'string'
      ? text
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .trim()
      : '';

  if (!cleanText) {
    return React.createElement(
      'div',
      { style: { fontWeight: 600, fontSize: '13.5px', color: '#0f172a', lineHeight: 1.4 } },
      title
    );
  }

  return React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
    React.createElement(
      'div',
      { style: { fontWeight: 700, fontSize: '14px', color: '#0f172a', lineHeight: 1.3 } },
      title
    ),
    React.createElement(
      'div',
      { style: { fontSize: '12.5px', color: '#475569', lineHeight: 1.4 } },
      cleanText
    )
  );
}

function fireReactToast(type, title, text = '', options = {}) {
  // Use modal only if explicitly requested or when displaying copyable code blocks
  if (options.modal || (typeof text === 'string' && text.includes('<code'))) {
    return LinkPilotModalSwal.fire({
      icon: type,
      iconColor: ICON_COLORS[type] || '#635bff',
      title: title || 'Notice',
      html: text,
      confirmButtonText: options.confirmText || 'Close',
      ...options,
    });
  }

  const autoClose = options.timer || (type === 'error' ? 4500 : 3500);
  const content = formatToastContent(title || (type === 'error' ? 'Error' : 'Notification'), text);
  const fn = toast[type] || toast.info;

  fn(content, {
    position: 'top-right',
    autoClose,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'light',
  });

  return Promise.resolve({ isConfirmed: true });
}

export const notify = {
  success(title, text = '', options = {}) {
    return fireReactToast('success', title || 'Success', text, options);
  },

  error(title, text = '', options = {}) {
    return fireReactToast('error', title || 'Error', text, options);
  },

  warning(title, text = '', options = {}) {
    return fireReactToast('warning', title || 'Warning', text, options);
  },

  info(title, text = '', options = {}) {
    return fireReactToast('info', title || 'Notice', text, options);
  },

  async confirm(title, text = '', options = {}) {
    const result = await LinkPilotModalSwal.fire({
      icon: options.icon || 'warning',
      iconColor: options.iconColor || '#f59e0b',
      title: title || 'Are you sure?',
      html: text,
      showCancelButton: true,
      confirmButtonText: options.confirmText || 'Yes, continue',
      cancelButtonText: options.cancelText || 'Cancel',
      focusCancel: true,
      ...options,
    });
    return result.isConfirmed;
  },

  toast(title, icon = 'success', timer = 3500) {
    return fireReactToast(icon, title, '', { timer });
  },

  loading(title = 'Processing...', text = '') {
    if (activeLoadingToastId) {
      toast.dismiss(activeLoadingToastId);
    }
    activeLoadingToastId = toast.loading(formatToastContent(title, text), {
      position: 'top-right',
      theme: 'light',
    });
  },

  close() {
    if (activeLoadingToastId) {
      toast.dismiss(activeLoadingToastId);
      activeLoadingToastId = null;
    }
    Swal.close();
    document.body.classList.remove('swal2-shown', 'swal2-height-auto');
    document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto');
    document.body.style.overflow = '';
  },
};

export default notify;
