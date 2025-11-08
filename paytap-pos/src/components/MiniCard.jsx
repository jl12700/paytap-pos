import React from 'react'

const MiniCard = ({title, icon, number, footerNum, onIconClick, cardType}) => {
    // Determine card styling based on cardType
    const getCardStyles = () => {
        switch (cardType) {
            case 'earnings':
                return {
                    iconBg: 'bg-[#02ca3a]',
                    numberColor: 'text-green-400'
                };
            case 'points':
                return {
                    iconBg: 'bg-yellow-500',
                    numberColor: 'text-yellow-400'
                };
            case 'cash':
                return {
                    iconBg: 'bg-blue-500',
                    numberColor: 'text-blue-400'
                };
            default:
                return {
                    iconBg: 'bg-[#02ca3a]',
                    numberColor: 'text-[#f5f5f5]'
                };
        }
    };

    const styles = getCardStyles();
    
    // Format number based on card type
    const formatNumber = () => {
        if (cardType === 'earnings') {
            return `₱${number}`;
        } else if (cardType === 'points') {
            return `${number} Points`;
        } else if (cardType === 'cash') {
            return `₱${number}`;
        }
        return number;
    };

    return (
        <div className='bg-[#1a1a1a] py-5 px-5 rounded-lg flex-1'>
            <div className='flex items-start justify-between'>
                <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
                    {title}
                </h1>
                {onIconClick ? (
                    <button 
                        onClick={onIconClick}
                        className={`${styles.iconBg} p-3 rounded-lg text-[#f5f5f5] text-2xl hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                        {icon}
                    </button>
                ) : (
                    <div className={`${styles.iconBg} p-3 rounded-lg text-[#f5f5f5] text-2xl cursor-default`}>
                        {icon}
                    </div>
                )}
            </div>
            <div>
                <h1 className={`${styles.numberColor} text-4xl font-bold mt-5`}>
                    {formatNumber()}
                </h1>
                {cardType === 'earnings' && footerNum !== undefined && (
                    <h1 className='text-[#f5f5f5] text-lg mt-2'>
                        <span className={parseFloat(footerNum) >= 0 ? 'text-[#02ca3a]' : 'text-red-500'}>
                            {parseFloat(footerNum) >= 0 ? '+' : ''}{footerNum}%
                        </span>
                        {' '}than yesterday
                    </h1>
                )}
            </div>
        </div>
    )
}

export default MiniCard