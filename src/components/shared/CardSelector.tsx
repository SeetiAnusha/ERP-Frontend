import React, { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { useCards } from '../../hooks/queries/useSharedData';
import { formatNumber } from '../../utils/formatNumber';

interface CardSelectorProps {
  value: string | number;
  onChange: (value: string) => void;
  cardType?: 'CREDIT' | 'DEBIT' | 'ALL';
  required?: boolean;
  disabled?: boolean;
  label?: string;
  showAvailableLimit?: boolean;
  filterActive?: boolean;
  className?: string;
  error?: string;
}

const CardSelector: React.FC<CardSelectorProps> = ({
  value,
  onChange,
  cardType = 'ALL',
  required = false,
  disabled = false,
  label = 'Card',
  showAvailableLimit = true,
  filterActive = true,
  className = '',
  error
}) => {
  const { data: allCards = [], isLoading } = useCards();

  const cards = useMemo(() => {
    let filtered = allCards;
    
    // Filter by active status
    if (filterActive) {
      filtered = filtered.filter((card: any) => card.status === 'ACTIVE');
    }
    
    // Filter by card type
    if (cardType !== 'ALL') {
      filtered = filtered.filter((card: any) => card.cardType === cardType);
    }
    
    return filtered;
  }, [allCards, cardType, filterActive]);

  const getCardDisplay = (card: any) => {
    const parts = [
      card.cardName || card.cardBrand,
      `****${card.lastFourDigits || card.cardNumberLast4}`
    ];
    
    if (showAvailableLimit && card.cardType === 'CREDIT') {
      const creditLimit = Number(card.creditLimit || 0);
      const usedCredit = Number(card.usedCredit || 0);
      const available = creditLimit - usedCredit;
      parts.push(`(Available: ₹${formatNumber(available)})`);
    }
    
    return parts.join(' - ');
  };

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500 text-sm">Loading cards...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CreditCard size={16} className="inline mr-1" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">Select card...</option>
        {cards.map((card: any) => (
          <option key={card.id} value={card.id}>
            {getCardDisplay(card)}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {cards.length === 0 && !isLoading && (
        <p className="mt-1 text-sm text-yellow-600">
          ⚠️ No {cardType !== 'ALL' ? cardType.toLowerCase() : ''} cards found. Please add a card first.
        </p>
      )}
    </div>
  );
};

export default CardSelector;
