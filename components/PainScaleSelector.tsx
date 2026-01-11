'use client';

interface PainScaleSelectorProps {
  value: string | number | undefined;
  onChange: (value: number) => void;
}

const painLevels = [
  {
    score: 0,
    label: 'No pain',
    emoji: '😊',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  {
    score: 1,
    label: 'Mild pain',
    emoji: '🙂',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  {
    score: 2,
    label: 'Moderate pain',
    emoji: '😐',
    color: 'from-yellow-400 to-green-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
  },
  {
    score: 3,
    label: 'Severe pain',
    emoji: '😟',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
  },
  {
    score: 4,
    label: 'Very severe pain',
    emoji: '😣',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  {
    score: 5,
    label: 'Worst pain possible',
    emoji: '😫',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
];

export default function PainScaleSelector({ value, onChange }: PainScaleSelectorProps) {
  const selectedScore = value === '' || value === undefined ? null : Number(value);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Pain Scale</label>
      
      {/* Rainbow gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 via-orange-400 to-red-500 rounded-full mb-2"></div>
      
      {/* Emoji selector */}
      <div className="flex items-center justify-between gap-2">
        {painLevels.map((level) => {
          const isSelected = selectedScore === level.score;
          
          return (
            <button
              key={level.score}
              type="button"
              onClick={() => onChange(level.score)}
              className={`
                flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? `${level.bgColor} ${level.borderColor} border-2 shadow-md scale-105` 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div className={`
                text-4xl mb-1 transition-transform
                ${isSelected ? 'scale-110' : 'scale-100'}
              `}>
                {level.emoji}
              </div>
              <span className={`
                text-xs font-medium mt-1 text-center
                ${isSelected ? 'text-gray-900' : 'text-gray-600'}
              `}>
                {level.label}
              </span>
              {isSelected && (
                <span className="text-xs font-bold text-gray-700 mt-1">
                  Score: {level.score}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedScore !== null && (
        <p className="text-sm text-gray-600 text-center">
          Selected: <span className="font-semibold">{painLevels[selectedScore].label} (Score: {selectedScore})</span>
        </p>
      )}
    </div>
  );
}

