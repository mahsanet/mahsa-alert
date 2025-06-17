import React from 'react';
import { Shield, MapPin, X } from 'lucide-react';

interface LocationPrivacyModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isDarkMode: boolean;
}

const LocationPrivacyModal: React.FC<LocationPrivacyModalProps> = ({ isOpen, onAccept, onDecline, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDecline}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-md rounded-xl shadow-2xl border-2 
        ${isDarkMode 
          ? 'bg-gray-900 border-gray-700 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
        }
        transform transition-all duration-300 scale-100
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold">حریم خصوصی موقعیت</h3>
          </div>
          
          <button
            onClick={onDecline}
            className={`
              p-2 rounded-full transition-colors
              ${isDarkMode 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">درخواست دسترسی به موقعیت</h4>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                برای بررسی امنیت موقعیت شما نسبت به نقاط خطرناک، نیاز به دسترسی به موقعیت جغرافیایی داریم.
              </p>
            </div>
          </div>

          <div className={`
            p-4 rounded-lg border-2 border-dashed
            ${isDarkMode 
              ? 'border-green-700 bg-green-900/20' 
              : 'border-green-300 bg-green-50'
            }
          `}>
            <h5 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              تضمین حریم خصوصی
            </h5>
            <ul className="text-sm space-y-1 text-green-600 dark:text-green-300">
              <li>• موقعیت شما فقط روی دستگاه شما پردازش می‌شود</li>
              <li>• هیچ داده‌ای در سرورها ذخیره نمی‌شود</li>
              <li>• موقعیت شما به هیچ شخص ثالثی ارسال نمی‌شود</li>
              <li>• تنها برای هشدارهای امنیتی محلی استفاده می‌شود</li>
            </ul>
          </div>

          <div className={`
            p-3 rounded-lg text-xs
            ${isDarkMode 
              ? 'bg-gray-800 text-gray-400' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            <strong>نکته:</strong> می‌توانید در هر زمان ردیابی موقعیت را متوقف کنید و این دسترسی کاملاً اختیاری است.
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={onDecline}
            className={`
              flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200
              ${isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
              }
            `}
          >
            انصراف
          </button>
          
          <button
            onClick={onAccept}
            className="
              flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200
              bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl
              border border-green-600
            "
          >
            موافقم، ادامه دهید
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPrivacyModal; 