import Swal from 'sweetalert2';

/**
 * LinkPilot Compact Top-Right Corner Notification & Alert System
 * Renders all errors, warnings, notices, and successes as small top-corner toasts
 */

const getThemeColors = () => ({
  background: '#ffffff',
  color: '#0f172a',
  subColor: '#475569',
  border: '#e2e8f0',
  backdrop: 'rgba(15, 23, 42, 0.45)',
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

function fireTopCornerToast(icon, title, text = '', options = {}) {
  // Only fall back to a modal if explicitly requested or when displaying copyable code blocks
  if (options.modal || (typeof text === 'string' && text.includes('<code'))) {
    return LinkPilotModalSwal.fire({
      icon,
      iconColor: ICON_COLORS[icon] || '#635bff',
      title: title || 'Notice',
      html: text,
      confirmButtonText: options.confirmText || 'Close',
      ...options,
    });
  }

  const theme = getThemeColors();
  const accent = ICON_COLORS[icon] || '#635bff';
  const duration = options.timer || (icon === 'error' ? 4500 : 3600);

  const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: duration,
    timerProgressBar: true,
    background: theme.background,
    color: theme.color,
    customClass: {
      container: 'linkpilot-top-toast-container',
      popup: `linkpilot-toast-popup linkpilot-toast-${icon}`,
      title: 'linkpilot-toast-title',
      htmlContainer: 'linkpilot-toast-body',
      closeButton: 'linkpilot-toast-close',
      timerProgressBar: 'linkpilot-swal-progress',
    },
    didOpen: toast => {
      toast.style.borderLeft = `4px solid ${accent}`;
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  return ToastMixin.fire({
    icon,
    iconColor: accent,
    title: title || (icon === 'error' ? 'Error' : 'Notification'),
    html: text ? `<div class="linkpilot-toast-subtext">${text}</div>` : undefined,
  });
}

export const notify = {
  /**
   * Compact Top-Right Success Notification
   */
  success(title, text = '', options = {}) {
    return fireTopCornerToast('success', title || 'Success', text, options);
  },

  /**
   * Compact Top-Right Error Notification
   */
  error(title, text = '', options = {}) {
    return fireTopCornerToast('error', title || 'Error', text, options);
  },

  /**
   * Compact Top-Right Warning Notification
   */
  warning(title, text = '', options = {}) {
    return fireTopCornerToast('warning', title || 'Warning', text, options);
  },

  /**
   * Compact Top-Right Info Notification
   */
  info(title, text = '', options = {}) {
    return fireTopCornerToast('info', title || 'Notice', text, options);
  },

  /**
   * Interactive Confirmation Dialog (returns Promise<boolean>)
   */
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

  /**
   * Slick Top-Right Toast Notification
   */
  toast(title, icon = 'success', timer = 3500) {
    return fireTopCornerToast(icon, title, '', { timer });
  },

  /**
   * Compact Top-Right Loading Toast
   */
  loading(title = 'Processing...', text = '') {
    const theme = getThemeColors();
    Swal.fire({
      toast: true,
      position: 'top-end',
      title,
      html: text ? `<div class="linkpilot-toast-subtext">${text}</div>` : undefined,
      background: theme.background,
      color: theme.color,
      showConfirmButton: false,
      allowOutsideClick: true,
      customClass: {
        container: 'linkpilot-top-toast-container',
        popup: 'linkpilot-toast-popup linkpilot-toast-info',
        title: 'linkpilot-toast-title',
        htmlContainer: 'linkpilot-toast-body',
      },
      didOpen: toast => {
        toast.style.borderLeft = '4px solid #635bff';
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
