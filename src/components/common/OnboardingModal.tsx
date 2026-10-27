import React from 'react';
import { StudentGateModal } from './StudentGateModal';

export const OnboardingModal: React.FC<{ isOpen?: boolean; onClose?: () => void }> = () => {
  return <StudentGateModal />;
};
