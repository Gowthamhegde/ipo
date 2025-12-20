import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

const IPOCard = ({ ipo }) => {
  // Handle both data formats (from API and mock data)
  const name = ipo.name || ipo.ipo_name || ipo.company;
  const company = ipo.company || ipo.company_name || name;
  const priceRange = ipo.priceRange || ipo.price_range || `₹${ipo.issue_price_min || 100} - ₹${ipo.issue_price_max || 120}`;
  const issueSize = ipo.issueSize || ipo.issue_size || 'TBA';
  const gmp = ipo.gmp || ipo.current_gmp || 0;
  const gmpPercent = parseFloat(ipo.gmpPercent || ipo.gmp_percent || ipo.gmp_percentage || 0);
  const status = ipo.status || 'Unknown';
  const industry = ipo.industry || ipo.sector || 'Others';
  const riskLevel = ipo.riskLevel || ipo.risk_level || 'Medium';
  const openDate = ipo.openDate || ipo.open_date;
  const closeDate = ipo.closeDate || ipo.close_date;
  const listingDate = ipo.listingDate || ipo.listing_date;
  const isProfitable = ipo.isProfitable || ipo.is_profitable || gmp >= 20;
  const recommendation = ipo.recommendation || (gmp >= 50 ? 'Strong Buy' : gmp >= 20 ? 'Buy' : gmp >= 0 ? 'Hold' : 'Avoid');
  
  const lotSize = parseInt(ipo.lotSize || ipo.lot_size || 30);
  const estimatedGain = ipo.estimatedGain || ipo.estimated_gain || Math.max(0, gmp * lotSize);

  // Status styling
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'listed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Risk level styling
  const getRiskStyle = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Recommendation styling
  const getRecommendationStyle = (rec) => {
    switch (rec?.toLowerCase()) {
      case 'strong buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'buy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avoid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // GMP trend icon
  const GMPTrendIcon = gmp > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const gmpTrendColor = gmp > 0 ? 'text-green-600' : 'text-red-600';

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'TBA';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
              {name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{company}</p>
            {industry && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                {industry}
              </span>
            )}
          </div>
          <div className="ml-4 flex flex-col space-y-2">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(status)}`}>
              {status?.toUpperCase()}
            </span>
            {isProfitable && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Profitable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Issue Price */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CurrencyRupeeIcon className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Issue Price
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">{priceRange}</p>
          </div>

          {/* Issue Size */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Issue Size
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {typeof issueSize === 'number' ? `₹${issueSize} Cr` : issueSize}
            </p>
          </div>
        </div>

        {/* GMP Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <GMPTrendIcon className={`h-5 w-5 ${gmpTrendColor} mr-2`} />
              <span className="text-sm font-semibold text-gray-700">Grey Market Premium</span>
            </div>
            {!isNaN(gmpPercent) && gmpPercent !== 0 && (
              <span className={`text-sm font-medium ${gmp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {gmp >= 0 ? '+' : ''}{gmpPercent.toFixed(1)}%
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${gmp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {gmp >= 0 ? '+' : ''}₹{Math.abs(gmp || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Current GMP</p>
            </div>
            
            {!isNaN(estimatedGain) && estimatedGain > 0 && (
              <div className="text-right">
                <p className="text-lg font-semibold text-indigo-600">
                  ₹{Number(estimatedGain).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500">Est. Gain</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Level and Recommendation */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
              Risk Level
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRiskStyle(riskLevel)}`}>
              {riskLevel}
            </span>
          </div>
          
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
              Recommendation
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRecommendationStyle(recommendation)}`}>
              {recommendation}
            </span>
          </div>
        </div>

        {/* Important Dates */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Important Dates
          </h4>
          
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Open:</span>
              <span className="font-medium text-gray-900">{formatDate(openDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Close:</span>
              <span className="font-medium text-gray-900">{formatDate(closeDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Listing:</span>
              <span className="font-medium text-gray-900">{formatDate(listingDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
        <div className="flex space-x-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            View Details
          </button>
          <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Get Prediction
          </button>
        </div>
      </div>
    </div>
  );
};

export default IPOCard;