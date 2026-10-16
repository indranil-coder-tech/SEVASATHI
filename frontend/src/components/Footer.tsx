import React from 'react';
import { Sprout, Database, ShieldAlert, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const CURRENT_YEAR = String(new Date().getFullYear());

export const Footer: React.FC = React.memo(() => {
  const { t } = useAppContext();

  return (
    <footer className="mt-16 border-t border-[#d5ded4] bg-[#E9EEE8] py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Brand & Principle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl neo-card flex items-center justify-center text-[#52785B]">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-[#26352B]">{t('footer.brand_name')}</span>
            </div>
            <p className="text-sm font-semibold text-[#304C38]">
              {t('footer.brand_tagline')}
            </p>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('footer.brand_mission')}
            </p>
          </div>

          {/* Column 2: Data Governance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#26352B]">
              <Database className="w-4 h-4 text-[#52785B]" />
              <span>{t('footer.verified_sources_title')}</span>
            </div>
            <ul className="text-xs text-[#69776D] space-y-1.5 leading-relaxed">
              <li>
                • <span className="text-[#304C38]">{t('footer.source_mandi')}</span>
              </li>
              <li>
                • <span className="text-[#304C38]">{t('footer.source_storage')}</span>
              </li>
              <li>
                • <span className="text-[#304C38]">{t('footer.source_logistics')}</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Prototype Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#26352B]">
              <ShieldAlert className="w-4 h-4 text-[#52785B]" />
              <span>{t('footer.transparency_title')}</span>
            </div>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('footer.transclaimer')}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#304C38] font-medium bg-[#52785B]/10 px-3 py-1 rounded-full border border-[#52785B]/20">
              <Award className="w-3.5 h-3.5 text-[#52785B]" />
              <span>{t('footer.prototype_badge')}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#d8e0d6] flex flex-col sm:flex-row items-center justify-between text-xs text-[#69776D] gap-3">
          <p>{t('footer.copyright', { year: CURRENT_YEAR })}</p>
          <p className="flex items-center gap-2">
            <span>{t('footer.pilot_crop')}</span>
            <span>•</span>
            <span>{t('footer.benchmark_market')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
});
