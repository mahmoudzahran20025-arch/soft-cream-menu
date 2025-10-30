import React from 'react';
import { Zap, Brain, Activity } from 'lucide-react';

const ENERGY_CONFIG = {
  mental: {
    label: 'طاقة ذهنية',
    labelEn: 'Mental Energy',
    icon: Brain,
    color: 'energy-mental',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-300',
    glowClass: 'energy-badge-mental'
  },
  physical: {
    label: 'طاقة بدنية',
    labelEn: 'Physical Energy',
    icon: Activity,
    color: 'energy-physical',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    glowClass: 'energy-badge-physical'
  },
  balanced: {
    label: 'طاقة متوازنة',
    labelEn: 'Balanced Energy',
    icon: Zap,
    color: 'energy-balanced',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    glowClass: 'energy-badge-balanced'
  }
};

/**
 * EnergyBadge Component
 * Displays energy type badge with icon and score
 * 
 * @param {string} energyType - 'mental' | 'physical' | 'balanced'
 * @param {number} energyScore - 0-100
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} showScore - Show energy score number
 * @param {boolean} showLabel - Show energy label text
 */
const EnergyBadge = ({ 
  energyType, 
  energyScore = 0, 
  size = 'md',
  showScore = true,
  showLabel = false,
  className = ''
}) => {
  if (!energyType || energyType === 'none') return null;

  const config = ENERGY_CONFIG[energyType];
  if (!config) return null;

  const Icon = config.icon;

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border-2
        ${config.bgClass} ${config.textClass} ${config.borderClass}
        ${sizeClasses[size]}
        font-semibold transition-all duration-300
        ${config.glowClass}
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />
      
      {showLabel && (
        <span className="whitespace-nowrap">{config.label}</span>
      )}
      
      {showScore && energyScore > 0 && (
        <span className="font-bold">{energyScore}</span>
      )}
    </div>
  );
};

/**
 * EnergyBar Component
 * Visual progress bar for energy score
 */
export const EnergyBar = ({ energyType, energyScore = 0, className = '' }) => {
  if (!energyType || energyType === 'none') return null;

  const config = ENERGY_CONFIG[energyType];
  if (!config) return null;

  const percentage = Math.min(Math.max(energyScore, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${config.textClass}`}>
          {config.label}
        </span>
        <span className={`text-xs font-bold ${config.textClass}`}>
          {energyScore}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.bgClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * EnergyIcon Component
 * Just the icon, useful for compact displays
 */
export const EnergyIcon = ({ energyType, size = 'md', className = '' }) => {
  if (!energyType || energyType === 'none') return null;

  const config = ENERGY_CONFIG[energyType];
  if (!config) return null;

  const Icon = config.icon;

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Icon 
      className={`${iconSizes[size]} ${config.textClass} ${className}`}
      strokeWidth={2.5}
    />
  );
};

export default EnergyBadge;
