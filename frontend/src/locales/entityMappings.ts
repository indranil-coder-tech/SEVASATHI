export type Language = 'mr' | 'hi' | 'en';

export interface EntityTranslation {
  mr: string;
  hi: string;
  en: string;
}

export const STATE_TRANSLATIONS: Record<string, EntityTranslation> = {
  'maharashtra': { mr: 'महाराष्ट्र', hi: 'महाराष्ट्र', en: 'Maharashtra' },
  'gujarat': { mr: 'गुजरात', hi: 'गुजरात', en: 'Gujarat' },
  'madhya pradesh': { mr: 'मध्य प्रदेश', hi: 'मध्य प्रदेश', en: 'Madhya Pradesh' },
  'karnataka': { mr: 'कर्नाटक', hi: 'कर्नाटक', en: 'Karnataka' },
  'rajasthan': { mr: 'राजस्थान', hi: 'राजस्थान', en: 'Rajasthan' },
  'punjab': { mr: 'पंजाब', hi: 'पंजाब', en: 'Punjab' },
  'haryana': { mr: 'हरियाणा', hi: 'हरियाणा', en: 'Haryana' },
  'uttar pradesh': { mr: 'उत्तर प्रदेश', hi: 'उत्तर प्रदेश', en: 'Uttar Pradesh' },
  'tamil nadu': { mr: 'तमिळनाडू', hi: 'तमिलनाडु', en: 'Tamil Nadu' },
  'telangana': { mr: 'तेलंगणा', hi: 'तेलंगाना', en: 'Telangana' },
  'andhra pradesh': { mr: 'आंध्र प्रदेश', hi: 'आंध्र प्रदेश', en: 'Andhra Pradesh' },
  'bihar': { mr: 'बिहार', hi: 'बिहार', en: 'Bihar' },
  'west bengal': { mr: 'पश्चिम बंगाल', hi: 'पश्चिम बंगाल', en: 'West Bengal' },
  'odisha': { mr: 'ओडिशा', hi: 'ओडिशा', en: 'Odisha' },
  'keralam': { mr: 'केरळ', hi: 'केरल', en: 'Keralam' },
};

export const DISTRICT_TRANSLATIONS: Record<string, EntityTranslation> = {
  'nashik': { mr: 'नाशिक', hi: 'नासिक', en: 'Nashik' },
  'pune': { mr: 'पुणे', hi: 'पुणे', en: 'Pune' },
  'ahilyanagar': { mr: 'अहिल्यानगर (अहमदनगर)', hi: 'अहिल्यानगर (अहमदनगर)', en: 'Ahilyanagar' },
  'ahmednagar': { mr: 'अहमदनगर', hi: 'अहमदनगर', en: 'Ahmednagar' },
  'jalgaon': { mr: 'जळगाव', hi: 'जलगांव', en: 'Jalgaon' },
  'solapur': { mr: 'सोलापूर', hi: 'सोलापुर', en: 'Solapur' },
  'latur': { mr: 'लातूर', hi: 'लातूर', en: 'Latur' },
  'chandrapur': { mr: 'चंद्रपूर', hi: 'चंद्रपुर', en: 'Chandrapur' },
  'amarawati': { mr: 'अमरावती', hi: 'अमरावती', en: 'Amarawati' },
  'amravati': { mr: 'अमरावती', hi: 'अमरावती', en: 'Amravati' },
  'akola': { mr: 'अकोला', hi: 'अकोला', en: 'Akola' },
  'buldhana': { mr: 'बुलढाणा', hi: 'बुलढाणा', en: 'Buldhana' },
  'nagpur': { mr: 'नागपूर', hi: 'नागपुर', en: 'Nagpur' },
  'chhatrapati sambhajinagar': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर', en: 'Chhatrapati Sambhajinagar' },
  'aurangabad': { mr: 'छत्रपती संभाजीनगर (औरंगाबाद)', hi: 'छत्रपति संभाजीनगर', en: 'Aurangabad' },
  'dharashiv': { mr: 'धाराशिव (उस्मानाबाद)', hi: 'धाराशिव (उस्मानाबाद)', en: 'Dharashiv' },
  'osmanabad': { mr: 'धाराशिव (उस्मानाबाद)', hi: 'धाराशिव (उस्मानाबाद)', en: 'Osmanabad' },
  'gadchiroli': { mr: 'गडचिरोली', hi: 'गडचिरोली', en: 'Gadchiroli' },
  'gondiya': { mr: 'गोंदिया', hi: 'गोंदिया', en: 'Gondiya' },
  'gondia': { mr: 'गोंदिया', hi: 'गोंदिया', en: 'Gondia' },
  'hingoli': { mr: 'हिंगोली', hi: 'हिंगोली', en: 'Hingoli' },
  'jalna': { mr: 'जालना', hi: 'जालना', en: 'Jalna' },
  'kolhapur': { mr: 'कोल्हापूर', hi: 'कोल्हापुर', en: 'Kolhapur' },
  'nanded': { mr: 'नांदेड', hi: 'नांदेड़', en: 'Nanded' },
  'nandurbar': { mr: 'नंदुरबार', hi: 'नंदुरबार', en: 'Nandurbar' },
  'parbhani': { mr: 'परभणी', hi: 'परभणी', en: 'Parbhani' },
  'raigad': { mr: 'रायगड', hi: 'रायगढ़', en: 'Raigad' },
  'sangli': { mr: 'सांगली', hi: 'सांगली', en: 'Sangli' },
  'satara': { mr: 'सातारा', hi: 'सतारा', en: 'Satara' },
  'sindhudurg': { mr: 'सिंधुदुर्ग', hi: 'सिंधुदुर्ग', en: 'Sindhudurg' },
  'ratnagiri': { mr: 'रत्नागिरी', hi: 'रत्नागिरी', en: 'Ratnagiri' },
  'thane': { mr: 'ठाणे', hi: 'ठाणे', en: 'Thane' },
  'wardha': { mr: 'वर्धा', hi: 'वर्धा', en: 'Wardha' },
  'washim': { mr: 'वाशीम', hi: 'वाशिम', en: 'Washim' },
  'yavatmal': { mr: 'यवतमाळ', hi: 'यवतमाल', en: 'Yavatmal' },
  'dhule': { mr: 'धुळे', hi: 'धुले', en: 'Dhule' },
  'bhandara': { mr: 'भंडारा', hi: 'भंडारा', en: 'Bhandara' },
  'beed': { mr: 'बीड', hi: 'बीड', en: 'Beed' },
  'mumbai': { mr: 'मुंबई', hi: 'मुंबई', en: 'Mumbai' },
};

export const COMMODITY_TRANSLATIONS: Record<string, EntityTranslation> = {
  'onion': { mr: 'कांदा (Onion)', hi: 'प्याज (Onion)', en: 'Onion' },
  'soyabean': { mr: 'सोयाबीन (Soyabean)', hi: 'सोयाबीन (Soyabean)', en: 'Soyabean' },
  'cotton': { mr: 'कापूस (Cotton)', hi: 'कपास (Cotton)', en: 'Cotton' },
  'wheat': { mr: 'गहू (Wheat)', hi: 'गेहूं (Wheat)', en: 'Wheat' },
  'potato': { mr: 'बटाटा (Potato)', hi: 'आलू (Potato)', en: 'Potato' },
  'tomato': { mr: 'टोमॅटो (Tomato)', hi: 'टमाटर (Tomato)', en: 'Tomato' },
  'maize': { mr: 'मका (Maize)', hi: 'मक्का (Maize)', en: 'Maize' },
  'green chilli': { mr: 'हिरवी मिरची', hi: 'हरी मिर्च', en: 'Green Chilli' },
  'chilli': { mr: 'मिरची', hi: 'मिर्च', en: 'Chilli' },
  'chilly capsicum': { mr: 'शिमला मिरची', hi: 'शिमला मिर्च', en: 'Chilly Capsicum' },
  'garlic': { mr: 'लसूण', hi: 'लहसुन', en: 'Garlic' },
  'ginger(green)': { mr: 'आले (ताजे)', hi: 'अदरक (हरा)', en: 'Ginger(Green)' },
  'ginger': { mr: 'आले', hi: 'अदरक', en: 'Ginger' },
  'bengal gram(gram)(whole)': { mr: 'हरभरा (चना)', hi: 'चना (साबुत)', en: 'Bengal Gram (Gram)(Whole)' },
  'bengal gram dal(chana dal)': { mr: 'चणा डाळ', hi: 'चना दाल', en: 'Chana Dal' },
  'red gram/arhar/tur(whole)': { mr: 'तूर (Arhar)', hi: 'अरहर / तूर (साबुत)', en: 'Red Gram/Arhar/Tur(whole)' },
  'black gram(urd beans)(whole)': { mr: 'उडीद', hi: 'उड़द (साबुत)', en: 'Black Gram(Urd Beans)(Whole)' },
  'bajra(pearl millet/cumbu)': { mr: 'बाजरी', hi: 'बाजरा', en: 'Bajra(Pearl Millet/Cumbu)' },
  'jowar(sorghum)': { mr: 'ज्वारी', hi: 'ज्वार', en: 'Jowar(Sorghum)' },
  'pomegranate': { mr: 'डाळिंब', hi: 'अनार', en: 'Pomegranate' },
  'grapes': { mr: 'द्राक्षे', hi: 'अंगूर', en: 'Grapes' },
  'banana': { mr: 'केळी', hi: 'केला', en: 'Banana' },
  'banana - green': { mr: 'कच्ची केळी', hi: 'कच्चा केला', en: 'Banana - Green' },
  'cabbage': { mr: 'कोबी', hi: 'पत्तागोभी', en: 'Cabbage' },
  'brinjal': { mr: 'वांगी', hi: 'बैंगन', en: 'Brinjal' },
  'lime': { mr: 'लिंबू', hi: 'नींबू', en: 'Lime' },
  'apple': { mr: 'सफरचंद', hi: 'सेब', en: 'Apple' },
  'almond(badam)': { mr: 'बदाम', hi: 'बादाम', en: 'Almond(Badam)' },
  'amla(nelli kai)': { mr: 'आवळा', hi: 'आंवला', en: 'Amla' },
  'beans': { mr: 'घेवडा / बीन्स', hi: 'बीन्स / सेम', en: 'Beans' },
  'beetroot': { mr: 'बीट', hi: 'चुकंदर', en: 'Beetroot' },
};

export const VARIETY_TRANSLATIONS: Record<string, EntityTranslation> = {
  'unhali': { mr: 'उन्हाळी', hi: 'उन्‍हारी (Unhali)', en: 'Unhali' },
  'red': { mr: 'लाल', hi: 'लाल', en: 'Red' },
  'red onion': { mr: 'लाल कांदा', hi: 'लाल प्याज', en: 'Red Onion' },
  'red / garva': { mr: 'लाल / गरवा', hi: 'लाल / गरवा', en: 'Red / Garva' },
  'local red': { mr: 'स्थानिक लाल', hi: 'स्थानीय लाल', en: 'Local Red' },
  'local': { mr: 'स्थानिक', hi: 'स्थानीय', en: 'Local' },
  'other': { mr: 'इतर', hi: 'अन्य', en: 'Other' },
  'faq': { mr: 'सर्वसाधारण प्रत (FAQ)', hi: 'सामान्य गुणवत्ता (FAQ)', en: 'FAQ' },
  'non-faq': { mr: 'दुय्यम प्रत (Non-FAQ)', hi: 'गैर-सामान्य गुणवत्ता (Non-FAQ)', en: 'Non-FAQ' },
  'deshi red': { mr: 'देशी लाल', hi: 'देशी लाल', en: 'Deshi Red' },
  'medium staple': { mr: 'मध्यम स्टेपल', hi: 'मध्यम स्टेपल', en: 'Medium Staple' },
  'yellow': { mr: 'पिवळा', hi: 'पीला', en: 'Yellow' },
  'white': { mr: 'पांढरा', hi: 'सफेद', en: 'White' },
  'hybrid': { mr: 'संकरित', hi: 'हाइब्रिड', en: 'Hybrid' },
  'standard': { mr: 'मानक प्रत', hi: 'मानक गुणवत्ता', en: 'Standard' },
};

export const MANDI_PREFIX_MAP: Record<string, EntityTranslation> = {
  'lasalgaon(vinchur)': { mr: 'लासलगाव (विंचूर)', hi: 'लासलगांव (विंचूर)', en: 'Lasalgaon(Vinchur)' },
  'lasalgaon': { mr: 'लासलगाव', hi: 'लासलगांव', en: 'Lasalgaon' },
  'apmc pimpalgaon baswant': { mr: 'पिंपळगाव बसवंत बाजार समिती', hi: 'पिंपलगांव बसवंत मंडी', en: 'APMC Pimpalgaon Baswant' },
  'pimpalgaon': { mr: 'पिंपळगाव बसवंत', hi: 'पिंपलगांव', en: 'Pimpalgaon' },
  'apmc yeola': { mr: 'येवला बाजार समिती', hi: 'येवला मंडी', en: 'APMC Yeola' },
  'yeola': { mr: 'येवला', hi: 'येवला', en: 'Yeola' },
  'apmc devala': { mr: 'देवळा बाजार समिती', hi: 'देवला मंडी', en: 'APMC Devala' },
  'devala': { mr: 'देवळा', hi: 'देवला', en: 'Devala' },
  'apmc kalvan': { mr: 'कळवण बाजार समिती', hi: 'कलवण मंडी', en: 'APMC Kalvan' },
  'kalvan': { mr: 'कळवण', hi: 'कलवण', en: 'Kalvan' },
  'apmc chandwad': { mr: 'चांदवड बाजार समिती', hi: 'चांदवड़ मंडी', en: 'APMC Chandwad' },
  'chandwad': { mr: 'चांदवड', hi: 'चांदवड़', en: 'Chandwad' },
  'apmc nampur': { mr: 'नामपूर बाजार समिती', hi: 'नामपुर मंडी', en: 'APMC Nampur' },
  'nampur': { mr: 'नामपूर', hi: 'नामपुर', en: 'Nampur' },
  'apmc manmad': { mr: 'मनमाड बाजार समिती', hi: 'मनमाड मंडी', en: 'APMC Manmad' },
  'manmad': { mr: 'मनमाड', hi: 'मनमाड', en: 'Manmad' },
  'apmc malegaon': { mr: 'मालेगाव बाजार समिती', hi: 'मालेगांव मंडी', en: 'APMC Malegaon' },
  'malegaon': { mr: 'मालेगाव', hi: 'मालेगांव', en: 'Malegaon' },
  'apmc sinnar': { mr: 'सिन्नर बाजार समिती', hi: 'सिन्नर मंडी', en: 'APMC Sinnar' },
  'sinnar': { mr: 'सिन्नर', hi: 'सिन्नर', en: 'Sinnar' },
  'pune': { mr: 'पुणे (गुलटेकडी)', hi: 'पुणे (गुलटेकड़ी)', en: 'Pune' },
  'pune gultekdi': { mr: 'पुणे गुलटेकडी', hi: 'पुणे गुलटेकड़ी', en: 'Pune Gultekdi' },
  'khed(chakan)': { mr: 'खेड (चाकण)', hi: 'खेड (चाकण)', en: 'Khed(Chakan)' },
  'solapur': { mr: 'सोलापूर', hi: 'सोलापुर', en: 'Solapur' },
  'ahmednagar': { mr: 'अहमदनगर', hi: 'अहमदनगर', en: 'Ahmednagar' },
  'latur': { mr: 'लातूर', hi: 'लातूर', en: 'Latur' },
  'jalgaon': { mr: 'जळगाव', hi: 'जलगांव', en: 'Jalgaon' },
};

export type EntityType = 'state' | 'district' | 'market' | 'commodity' | 'variety';

const KNOWN_TYPES = new Set<string>(['state', 'district', 'market', 'commodity', 'variety']);

/**
 * Reusable entity translator for dynamic government API values.
 * Returns translated display string in Marathi/Hindi, or preserves original if unmapped.
 * Supports both (type, rawName) and (rawName, type) parameter orders.
 */
export function translateEntity(
  arg1: string,
  arg2?: string,
  lang: Language = 'mr'
): string {
  if (!arg1 && !arg2) return '';

  let type: EntityType | undefined;
  let rawName: string;

  if (KNOWN_TYPES.has(arg1) && arg2) {
    type = arg1 as EntityType;
    rawName = arg2;
  } else if (arg2 && KNOWN_TYPES.has(arg2)) {
    type = arg2 as EntityType;
    rawName = arg1;
  } else {
    rawName = arg1 || (arg2 || '');
  }

  if (!rawName) return '';
  const key = rawName.trim().toLowerCase();

  if (lang === 'en') {
    return rawName.trim();
  }

  let match: EntityTranslation | undefined;
  if (type === 'state') match = STATE_TRANSLATIONS[key];
  else if (type === 'district') match = DISTRICT_TRANSLATIONS[key];
  else if (type === 'commodity') match = COMMODITY_TRANSLATIONS[key];
  else if (type === 'variety') match = VARIETY_TRANSLATIONS[key];
  else if (type === 'market') {
    match = MANDI_PREFIX_MAP[key];
    if (!match) {
      // Check partial match for APMC names e.g. "APMC Pimpalgaon Baswant"
      for (const [mKey, trans] of Object.entries(MANDI_PREFIX_MAP)) {
        if (key.includes(mKey) || mKey.includes(key)) {
          match = trans;
          break;
        }
      }
    }
  } else {
    match =
      COMMODITY_TRANSLATIONS[key] ||
      DISTRICT_TRANSLATIONS[key] ||
      MANDI_PREFIX_MAP[key] ||
      STATE_TRANSLATIONS[key] ||
      VARIETY_TRANSLATIONS[key];
    if (!match) {
      for (const [mKey, trans] of Object.entries(MANDI_PREFIX_MAP)) {
        if (key.includes(mKey) || mKey.includes(key)) {
          match = trans;
          break;
        }
      }
    }
  }

  if (match && match[lang]) {
    return match[lang];
  }

  // If unmapped, preserve the clean original name
  return rawName.trim();
}

