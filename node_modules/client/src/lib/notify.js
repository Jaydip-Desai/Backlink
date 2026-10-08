import Swal from 'sweetalert2';

/**
 * LinkPilot Premium Notification & Alert System
 * Cohesive with LinkPilot SaaS Design System
 */

const getThemeColors = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    background: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    backdrop: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.5)',
  };
};
const LinkPilotSwal = Swal.mixin({
  didOpen: popup => {
    const theme = getThemeColors();
    popup.style.backgroundColor = theme.background;
    popup.style.color = theme.color;
    popup.style.borderRadius = '20px';
    popup.style.boxShadow = '0 20px 50px -10px rgba(0, 0, 0, 0.3)';
    popup.style.border = '1px solid rgba(148, 163, 184, 0.2)';
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

export const notify = {
  /**
   * Premium Animated Success Alert
   */
  success(title, text = '', options = {}) {
    return LinkPilotSwal.fire({
      icon: 'success',
      iconColor: '#10b981',
      title: title || 'Success',
      html: text,
      confirmButtonText: options.confirmText || 'Got it',
      timer: options.timer,
      timerProgressBar: Boolean(options.timer),
      ...options,
    });
  },

  /**
   * Premium Animated Error Alert
   */
  error(title, text = '', options = {}) {
    return LinkPilotSwal.fire({
      icon: 'error',
      iconColor: '#ef4444',
      title: title || 'Error Occurred',
      html: text,
      confirmButtonText: options.confirmText || 'Close',
      ...options,
    });
  },

  /**
   * Premium Animated Warning Alert
   */
  warning(title, text = '', options = {}) {
    return LinkPilotSwal.fire({
      icon: 'warning',
      iconColor: '#f59e0b',
      title: title || 'Warning',
      html: text,
      confirmButtonText: options.confirmText || 'Proceed',
      ...options,
    });
  },

  /**
   * Premium Animated Info Alert
   */
  info(title, text = '', options = {}) {
    return LinkPilotSwal.fire({
      icon: 'info',
      iconColor: '#635bff',
      title: title || 'Notice',
      html: text,
      confirmButtonText: options.confirmText || 'Dismiss',
      ...options,
    });
  },

  /**
   * Interactive Confirmation Dialog (returns Promise<boolean>)
   */
  async confirm(title, text = '', options = {}) {
    const result = await LinkPilotSwal.fire({
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

  /**
   * Slick Top-Right Toast Notification
   */
  toast(title, icon = 'success', timer = 3500) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      background: isDark ? '#111827' : '#ffffff',
      color: isDark ? '#f9fafb' : '#111827',
      customClass: {
        popup: 'linkpilot-toast-popup',
        title: 'linkpilot-toast-title',
        timerProgressBar: 'linkpilot-swal-progress',
      },
      didOpen: toast => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });

    const iconColors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#635bff',
    };

    return Toast.fire({
      icon,
      iconColor: iconColors[icon] || '#635bff',
      title,
    });
  },

  /**
   * Animated Loading State Modal
   */
  loading(title = 'Processing...', text = 'Please wait while LinkPilot processes your request.') {
    LinkPilotSwal.fire({
      title,
      html: text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  /**
   * Programmatically Close Any Open Alert
   */
  close() {
    Swal.close();
    document.body.classList.remove('swal2-shown', 'swal2-height-auto');
    document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto');
    document.body.style.overflow = '';
  },
};

export default notify;
