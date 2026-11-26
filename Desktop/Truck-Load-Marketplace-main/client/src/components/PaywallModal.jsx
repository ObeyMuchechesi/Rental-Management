import { useEffect, useState } from 'react';
import CheckoutModal from './CheckoutModal';

export function usePaywall() {
  const [state, setState] = useState({ open: false, message: '' });

  useEffect(() => {
    const onPaywall = (event) => {
      setState({ open: true, message: event.detail?.message || '' });
    };
    window.addEventListener('paywall', onPaywall);
    return () => window.removeEventListener('paywall', onPaywall);
  }, []);

  return {
    open: state.open,
    message: state.message,
    openPaywall: () => setState({ open: true, message: '' }),
    closePaywall: () => setState({ open: false, message: '' }),
  };
}

export default function PaywallModal({ open, message, onClose }) {
  return (
    <CheckoutModal
      open={open}
      onClose={onClose}
      presetPlan="credits"
      title="Unlock contact details"
      message={
        message ||
        'Choose a plan to see phone numbers, exact locations and contact the other side directly.'
      }
      closeLabel="Maybe later"
    />
  );
}
