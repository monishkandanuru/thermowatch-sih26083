'use client';

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const translations: Record<string, string> = {
  'Current human thermal stress': 'ಪ್ರಸ್ತುತ ಮಾನವ ಉಷ್ಣ ಒತ್ತಡ',
  'CURRENT HUMAN THERMAL STRESS': 'ಪ್ರಸ್ತುತ ಮಾನವ ಉಷ್ಣ ಒತ್ತಡ',
  'India risk map': 'ಭಾರತದ ಅಪಾಯ ನಕ್ಷೆ',
  'SPATIAL VIEW': 'ಭೌಗೋಳಿಕ ನೋಟ',
  'NEXT WARNING WINDOW': 'ಮುಂದಿನ ಎಚ್ಚರಿಕೆ ಅವಧಿ',
  'Risk horizon': 'ಅಪಾಯದ ಮುನ್ಸೂಚನೆ',
  'PRIORITY LOCATIONS': 'ಆದ್ಯತೆಯ ಸ್ಥಳಗಳು',
  Hotspots: 'ಅತಿ ಅಪಾಯದ ಸ್ಥಳಗಳು',
  'Ranked by current HTSI.': 'ಪ್ರಸ್ತುತ HTSI ಆಧಾರಿತ ಶ್ರೇಣಿ.',
  'What to do now': 'ಈಗ ಏನು ಮಾಡಬೇಕು',
  'Continue routine monitoring and hydration messaging.':
    'ನಿಯಮಿತ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ನೀರು ಕುಡಿಯುವ ಸಂದೇಶಗಳನ್ನು ಮುಂದುವರಿಸಿ.',
  'Increase public advisories and check vulnerable residents.':
    'ಸಾರ್ವಜನಿಕ ಸಲಹೆಗಳನ್ನು ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಅಪಾಯದಲ್ಲಿರುವ ನಿವಾಸಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
  'Open cooling spaces, adjust outdoor work and alert health teams.':
    'ತಂಪು ಸ್ಥಳಗಳನ್ನು ತೆರೆಯಿರಿ, ಹೊರಾಂಗಣ ಕೆಲಸವನ್ನು ಹೊಂದಿಸಿ ಮತ್ತು ಆರೋಗ್ಯ ತಂಡಗಳಿಗೆ ಎಚ್ಚರಿಕೆ ನೀಡಿ.',
  'Activate district heat action plans and targeted outreach immediately.':
    'ನಗರದ ಉಷ್ಣ ಕ್ರಿಯಾ ಯೋಜನೆ ಮತ್ತು ಗುರಿಯುಕ್ತ ಸಂಪರ್ಕವನ್ನು ತಕ್ಷಣ ಸಕ್ರಿಯಗೊಳಿಸಿ.',
  'Escalate emergency response, suspend unsafe exposure and mobilize medical support.':
    'ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಹೆಚ್ಚಿಸಿ, ಅಸುರಕ್ಷಿತ ಬಿಸಿ ಸಂಪರ್ಕವನ್ನು ನಿಲ್ಲಿಸಿ ಮತ್ತು ವೈದ್ಯಕೀಯ ನೆರವನ್ನು ಸಜ್ಜುಗೊಳಿಸಿ.',
  'Increase hydration messaging and reduce peak-hour exposure.':
    'ನೀರು ಕುಡಿಯುವ ಸಂದೇಶಗಳನ್ನು ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಗರಿಷ್ಠ ಬಿಸಿಯ ಸಮಯದ ಸಂಪರ್ಕವನ್ನು ಕಡಿಮೆ ಮಾಡಿ.',
  Explore: 'ವಿವರವಾಗಿ ನೋಡಿ',
  Selected: 'ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ',
  'Live conditions': 'ನೇರ ಪರಿಸ್ಥಿತಿಗಳು',
  districts: 'ನಗರಗಳು',
  'Boundary geometry · CC BY 4.0': 'ಗಡಿ ನಕ್ಷೆ · CC BY 4.0',
  'Geographic heat-risk map of India showing':
    'ಭಾರತದ ಭೌಗೋಳಿಕ ಉಷ್ಣ ಅಪಾಯ ನಕ್ಷೆ; ಇದರಲ್ಲಿ',
  'monitored cities': 'ಮೇಲ್ವಿಚಾರಣೆಯ ನಗರಗಳನ್ನು ತೋರಿಸಲಾಗಿದೆ',
  'percent High plus probability': 'ಶೇಕಡಾ ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸಂಭವನೀಯತೆ',
  Low: 'ಕಡಿಮೆ',
  Moderate: 'ಮಧ್ಯಮ',
  High: 'ಹೆಚ್ಚು',
  Extreme: 'ತೀವ್ರ',
  Emergency: 'ತುರ್ತು',
  'High+': 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
  risk: 'ಅಪಾಯ',
  forecast: 'ಮುನ್ಸೂಚನೆ',
  warning: 'ಎಚ್ಚರಿಕೆ',
  warnings: 'ಎಚ್ಚರಿಕೆಗಳು',
  current: 'ಪ್ರಸ್ತುತ',
  status: 'ಸ್ಥಿತಿ',
  source: 'ಮೂಲ',
  humidity: 'ಆರ್ದ್ರತೆ',
  'live weather': 'ನೇರ ಹವಾಮಾನ',
  'safe fallback': 'ಸುರಕ್ಷಿತ ಪರ್ಯಾಯ ದತ್ತಾಂಶ',
  'HEAT INDEX': 'ಉಷ್ಣ ಸೂಚ್ಯಂಕ',
  'Heat Index': 'ಉಷ್ಣ ಸೂಚ್ಯಂಕ',
  'Peak risk:': 'ಗರಿಷ್ಠ ಅಪಾಯ:',
  'tomorrow afternoon': 'ನಾಳೆ ಮಧ್ಯಾಹ್ನ',
  'EXPOSURE LENS': 'ಅಪಾಯಕ್ಕೆ ಒಡ್ಡಿಕೊಳ್ಳುವವರ ನೋಟ',
  'Who needs help first?': 'ಮೊದಲು ಯಾರಿಗೆ ನೆರವು ಬೇಕು?',
  'Human context changes the risk.': 'ವೈಯಕ್ತಿಕ ಪರಿಸ್ಥಿತಿ ಅಪಾಯವನ್ನು ಬದಲಿಸುತ್ತದೆ.',
  'Healthy adult': 'ಆರೋಗ್ಯವಂತ ವಯಸ್ಕ',
  Child: 'ಮಗು',
  'Older adult': 'ಹಿರಿಯ ವಯಸ್ಕ',
  'Outdoor worker': 'ಹೊರಾಂಗಣ ಕಾರ್ಮಿಕ',
  'Pregnant person': 'ಗರ್ಭಿಣಿ',
  'Cardiac or respiratory condition': 'ಹೃದಯ ಅಥವಾ ಉಸಿರಾಟದ ಸಮಸ್ಯೆ',
  exposure: 'ಒಡ್ಡಿಕೊಳ್ಳುವಿಕೆ',
  'PERSONALIZED SCREENING': 'ವೈಯಕ್ತಿಕ ಅಪಾಯ ಪರಿಶೀಲನೆ',
  'Adjust exposure context': 'ವೈಯಕ್ತಿಕ ಪರಿಸ್ಥಿತಿಯನ್ನು ಹೊಂದಿಸಿ',
  'Not a medical diagnosis.': 'ಇದು ವೈದ್ಯಕೀಯ ನಿರ್ಣಯವಲ್ಲ.',
  AGE: 'ವಯಸ್ಸು',
  Adult: 'ವಯಸ್ಕ',
  ACTIVITY: 'ಚಟುವಟಿಕೆ',
  Resting: 'ವಿಶ್ರಾಂತಿ',
  'Heavy work': 'ಕಠಿಣ ಕೆಲಸ',
  'Acclimatized to local heat': 'ಸ್ಥಳೀಯ ಬಿಸಿಗೆ ಹೊಂದಿಕೊಂಡಿದ್ದಾರೆ',
  'Calculate personal HTSI': 'ವೈಯಕ್ತಿಕ HTSI ಲೆಕ್ಕಿಸಿ',
  'Personal HTSI': 'ವೈಯಕ್ತಿಕ HTSI',
  'RESPONSE GUIDE': 'ಪ್ರತಿಕ್ರಿಯಾ ಮಾರ್ಗದರ್ಶಿ',
  'Three actions now': 'ಈಗ ಕೈಗೊಳ್ಳಬೇಕಾದ ಮೂರು ಕ್ರಮಗಳು',
  Observe: 'ಗಮನಿಸಿ',
  'Monitor the forecast and thermal-stress trend.':
    'ಮುನ್ಸೂಚನೆ ಮತ್ತು ಉಷ್ಣ ಒತ್ತಡದ ಪ್ರವೃತ್ತಿಯನ್ನು ಗಮನಿಸಿ.',
  Prepare: 'ಸಿದ್ಧರಾಗಿ',
  'Open cooling spaces and adjust outdoor work.':
    'ತಂಪು ಕೇಂದ್ರಗಳನ್ನು ತೆರೆಯಿರಿ ಮತ್ತು ಹೊರಾಂಗಣ ಕೆಲಸವನ್ನು ಹೊಂದಿಸಿ.',
  Alert: 'ಎಚ್ಚರಿಸಿ',
  'Notify vulnerable groups before the peak.':
    'ಗರಿಷ್ಠ ಬಿಸಿಗೂ ಮುನ್ನ ಅಪಾಯದಲ್ಲಿರುವವರಿಗೆ ತಿಳಿಸಿ.',
  'Open alert center': 'ಎಚ್ಚರಿಕೆ ಕೇಂದ್ರ ತೆರೆಯಿರಿ',
  'FIVE-DAY OUTLOOK': 'ಐದು ದಿನಗಳ ಮುನ್ಸೂಚನೆ',
  'Forecast HTSI': 'ಮುನ್ಸೂಚಿತ HTSI',
  'Three-hour rolling thermal-stress signal.':
    'ಮೂರು ಗಂಟೆಗಳಿಗೊಮ್ಮೆ ನವೀಕರಿಸುವ ಉಷ್ಣ ಒತ್ತಡದ ಸೂಚನೆ.',
  TEMPERATURE: 'ತಾಪಮಾನ',
  Temperature: 'ತಾಪಮಾನ',
  'Temperature °C': 'ತಾಪಮಾನ °C',
  'Heat profile': 'ಉಷ್ಣ ಸ್ಥಿತಿಯ ವಿವರ',
  'Colour follows predicted risk class.':
    'ಬಣ್ಣವು ಮುನ್ಸೂಚಿತ ಅಪಾಯದ ವರ್ಗವನ್ನು ಸೂಚಿಸುತ್ತದೆ.',
  'EXPLAINABLE PREDICTION': 'ವಿವರಿಸಬಹುದಾದ ಮುನ್ಸೂಚನೆ',
  'Why the risk moves': 'ಅಪಾಯ ಏಕೆ ಬದಲಾಗುತ್ತದೆ',
  'Temperature, humidity, WBGT, PET, solar load, UV, wind and time of day contribute to each class.':
    'ತಾಪಮಾನ, ಆರ್ದ್ರತೆ, WBGT, PET, ಸೌರಭಾರ, UV, ಗಾಳಿ ಮತ್ತು ದಿನದ ಸಮಯವು ಪ್ರತಿ ಅಪಾಯ ವರ್ಗಕ್ಕೆ ಕಾರಣವಾಗುತ್ತವೆ.',
  raises: 'ಹೆಚ್ಚಿಸುತ್ತದೆ',
  reduces: 'ಕಡಿಮೆ ಮಾಡುತ್ತದೆ',
  class: 'ವರ್ಗವನ್ನು',
  contribution: 'ಕೊಡುಗೆ',
  value: 'ಮೌಲ್ಯ',
  'Forecast risk layer': 'ಮುನ್ಸೂಚನೆಯ ಅಪಾಯ ಪದರ',
  'ML predictions across all monitored locations':
    'ಮೇಲ್ವಿಚಾರಣೆಯ ಎಲ್ಲಾ ಸ್ಥಳಗಳ ML ಮುನ್ಸೂಚನೆಗಳು',
  Live: 'ನೇರ',
  'Refresh layers': 'ಪದರಗಳನ್ನು ನವೀಕರಿಸಿ',
  'SPATIAL COMMAND': 'ಭೌಗೋಳಿಕ ನಿಯಂತ್ರಣ',
  'India live risk map': 'ಭಾರತದ ನೇರ ಅಪಾಯ ನಕ್ಷೆ',
  'Current model classifications across monitored districts.':
    'ಮೇಲ್ವಿಚಾರಣೆಯ ನಗರಗಳ ಪ್ರಸ್ತುತ ಮಾದರಿ ವರ್ಗೀಕರಣ.',
  'Select a marker to inspect its predicted class and High+ probability.':
    'ಮುನ್ಸೂಚಿತ ವರ್ಗ ಮತ್ತು ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸಂಭವನೀಯತೆಯನ್ನು ನೋಡಲು ಗುರುತನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'Building national forecast layers': 'ರಾಷ್ಟ್ರೀಯ ಮುನ್ಸೂಚನೆ ಪದರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ',
  'ALL LOCATIONS': 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು',
  'Ranked by forecast High+ probability.':
    'ಹೆಚ್ಚಿನ ಅಪಾಯದ ಮುನ್ಸೂಚನೆ ಸಂಭವನೀಯತೆಯ ಆಧಾರದ ಮೇಲೆ ಶ್ರೇಣಿ.',
  'Test accuracy': 'ಪರೀಕ್ಷಾ ನಿಖರತೆ',
  Accuracy: 'ನಿಖರತೆ',
  Precision: 'ನಿಖರ ಮುನ್ಸೂಚನೆ ಪ್ರಮಾಣ',
  Recall: 'ಪತ್ತೆ ಪ್ರಮಾಣ',
  'Macro F1': 'ಮ್ಯಾಕ್ರೋ F1',
  'Observed-class balance': 'ಗಮನಿಸಿದ ವರ್ಗಗಳ ಸಮತೋಲನ',
  'macro average': 'ಮ್ಯಾಕ್ರೋ ಸರಾಸರಿ',
  'observed classes': 'ಗಮನಿಸಿದ ವರ್ಗಗಳು',
  Mod: 'ಮಧ್ಯ',
  Hig: 'ಹೆಚ್ಚು',
  Ext: 'ತೀವ್ರ',
  Eme: 'ತುರ್ತು',
  'False alarms': 'ತಪ್ಪು ಎಚ್ಚರಿಕೆಗಳು',
  'High+ predicted, lower actual': 'ಹೆಚ್ಚಿನ ಅಪಾಯ ಮುನ್ಸೂಚನೆ, ಆದರೆ ವಾಸ್ತವದಲ್ಲಿ ಕಡಿಮೆ',
  'Missed events': 'ತಪ್ಪಿಹೋದ ಘಟನೆಗಳು',
  'High+ actual, lower predicted': 'ವಾಸ್ತವದಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಪಾಯ, ಆದರೆ ಮುನ್ಸೂಚನೆ ಕಡಿಮೆ',
  'Class-balanced multinomial logistic regression':
    'ವರ್ಗ-ಸಮತೋಲಿತ ಬಹುವರ್ಗ ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್',
  'Open-Meteo ERA5-Seamless historical weather':
    'Open-Meteo ERA5-Seamless ಐತಿಹಾಸಿಕ ಹವಾಮಾನ',
  'Real historical weather with HTSI-derived proxy thermal-risk labels; not verified IMD event or health-outcome labels.':
    'HTSI ಆಧಾರಿತ ಪ್ರತಿನಿಧಿ ಉಷ್ಣ ಅಪಾಯ ವರ್ಗಗಳಿರುವ ನೈಜ ಐತಿಹಾಸಿಕ ಹವಾಮಾನ; ಇವು ಪರಿಶೀಲಿತ IMD ಘಟನೆ ಅಥವಾ ಆರೋಗ್ಯ ಫಲಿತಾಂಶದ ವರ್ಗಗಳಲ್ಲ.',
  'Relative humidity': 'ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ',
  'Wind speed': 'ಗಾಳಿಯ ವೇಗ',
  'Solar radiation': 'ಸೌರ ವಿಕಿರಣ',
  'UV proxy': 'UV ಪ್ರತಿನಿಧಿ',
  'Time of day (sin)': 'ದಿನದ ಸಮಯ (sin)',
  'Time of day (cos)': 'ದಿನದ ಸಮಯ (cos)',
  'Season (sin)': 'ಋತು (sin)',
  'Season (cos)': 'ಋತು (cos)',
  Latitude: 'ಅಕ್ಷಾಂಶ',
  Longitude: 'ರೇಖಾಂಶ',
  Coverage: 'ವ್ಯಾಪ್ತಿ',
  'districts monitored': 'ಮೇಲ್ವಿಚಾರಣೆಯ ನಗರಗಳು',
  'High+ zones': 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ವಲಯಗಳು',
  'require action': 'ಕ್ರಮ ಅಗತ್ಯ',
  'Active alerts': 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು',
  'awaiting acknowledgement': 'ಸ್ವೀಕೃತಿ ಬಾಕಿಯಿದೆ',
  'Open incidents': 'ಮುಕ್ತ ಘಟನೆಗಳು',
  'community field reports': 'ಸಮುದಾಯದ ವರದಿಗಳು',
  'PRIORITY QUEUE': 'ಆದ್ಯತಾ ಪಟ್ಟಿ',
  'Highest-risk locations': 'ಅತಿ ಅಪಾಯದ ಸ್ಥಳಗಳು',
  'CSV brief': 'CSV ಸಂಕ್ಷಿಪ್ತ ವರದಿ',
  'RESPONSE PLAYBOOK': 'ಪ್ರತಿಕ್ರಿಯಾ ಕಾರ್ಯಯೋಜನೆ',
  'Recommended now': 'ಈಗ ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು',
  'Print / PDF': 'ಮುದ್ರಿಸಿ / PDF',
  'Open and clearly signpost cooling centres before peak heat.':
    'ಗರಿಷ್ಠ ಬಿಸಿಗೂ ಮುನ್ನ ತಂಪು ಕೇಂದ್ರಗಳನ್ನು ತೆರೆಯಿರಿ ಮತ್ತು ಸ್ಪಷ್ಟ ಸೂಚನಾ ಫಲಕ ಹಾಕಿ.',
  'Move outdoor labour and school activity away from 12–4 PM.':
    'ಹೊರಾಂಗಣ ಕೆಲಸ ಮತ್ತು ಶಾಲಾ ಚಟುವಟಿಕೆಯನ್ನು ಮಧ್ಯಾಹ್ನ 12–4ರಿಂದ ಬೇರೆ ಸಮಯಕ್ಕೆ ಬದಲಿಸಿ.',
  'Prioritise older adults, children, outdoor workers and people with chronic illness.':
    'ಹಿರಿಯರು, ಮಕ್ಕಳು, ಹೊರಾಂಗಣ ಕಾರ್ಮಿಕರು ಮತ್ತು ದೀರ್ಘಕಾಲದ ಅನಾರೋಗ್ಯ ಇರುವವರಿಗೆ ಆದ್ಯತೆ ನೀಡಿ.',
  'Pre-position water, ORS and emergency medical teams in High+ districts.':
    'ಹೆಚ್ಚಿನ ಅಪಾಯದ ನಗರಗಳಲ್ಲಿ ನೀರು, ORS ಮತ್ತು ತುರ್ತು ವೈದ್ಯಕೀಯ ತಂಡಗಳನ್ನು ಮುಂಚಿತವಾಗಿ ಸಿದ್ಧಪಡಿಸಿ.',
  'LIVE OPEN DATA': 'ನೇರ ಮುಕ್ತ ದತ್ತಾಂಶ',
  'Nearby response facilities': 'ಹತ್ತಿರದ ಪ್ರತಿಕ್ರಿಯಾ ಸೌಲಭ್ಯಗಳು',
  'Hospitals, clinics, community centres and water points from OpenStreetMap.':
    'OpenStreetMapನ ಆಸ್ಪತ್ರೆಗಳು, ಚಿಕಿತ್ಸಾಲಯಗಳು, ಸಮುದಾಯ ಕೇಂದ್ರಗಳು ಮತ್ತು ಕುಡಿಯುವ ನೀರಿನ ಸ್ಥಳಗಳು.',
  'Finding nearby support': 'ಹತ್ತಿರದ ನೆರವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ',
  hospital: 'ಆಸ್ಪತ್ರೆ',
  clinic: 'ಚಿಕಿತ್ಸಾಲಯ',
  community_centre: 'ಸಮುದಾಯ ಕೇಂದ್ರ',
  drinking_water: 'ಕುಡಿಯುವ ನೀರು',
  'No nearby facilities were returned. OpenStreetMap availability can vary; the district alert workflow remains available.':
    'ಹತ್ತಿರದ ಸೌಲಭ್ಯಗಳು ಸಿಗಲಿಲ್ಲ. OpenStreetMap ಲಭ್ಯತೆ ಬದಲಾಗಬಹುದು; ನಗರದ ಎಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆ ಇನ್ನೂ ಲಭ್ಯವಿದೆ.',
  'COMMUNITY SIGNAL': 'ಸಮುದಾಯದ ಸೂಚನೆ',
  'Report a heat incident': 'ಉಷ್ಣ ಘಟನೆ ವರದಿ ಮಾಡಿ',
  'Saved to the authority audit trail.': 'ಪ್ರಾಧಿಕಾರದ ಪರಿಶೀಲನಾ ದಾಖಲೆಯಲ್ಲಿ ಉಳಿಸಲಾಗುತ್ತದೆ.',
  'INCIDENT TYPE': 'ಘಟನೆಯ ಪ್ರಕಾರ',
  'Heat illness': 'ಬಿಸಿಯಿಂದ ಉಂಟಾದ ಅಸ್ವಸ್ಥತೆ',
  'Water shortage': 'ನೀರಿನ ಕೊರತೆ',
  'Power outage': 'ವಿದ್ಯುತ್ ವ್ಯತ್ಯಯ',
  'Cooling centre issue': 'ತಂಪು ಕೇಂದ್ರದ ಸಮಸ್ಯೆ',
  'Outdoor worker exposure': 'ಹೊರಾಂಗಣ ಕಾರ್ಮಿಕರ ಬಿಸಿ ಸಂಪರ್ಕ',
  SEVERITY: 'ತೀವ್ರತೆ',
  REPORTER: 'ವರದಿದಾರ',
  'Name or organisation (optional)': 'ಹೆಸರು ಅಥವಾ ಸಂಸ್ಥೆ (ಐಚ್ಛಿಕ)',
  'WHAT HAPPENED?': 'ಏನಾಯಿತು?',
  'Describe the location, incident and immediate need.':
    'ಸ್ಥಳ, ಘಟನೆ ಮತ್ತು ತಕ್ಷಣದ ಅಗತ್ಯವನ್ನು ವಿವರಿಸಿ.',
  'Submit incident': 'ಘಟನೆಯನ್ನು ಸಲ್ಲಿಸಿ',
  'RECENT REPORTS': 'ಇತ್ತೀಚಿನ ವರದಿಗಳು',
  'incident log': 'ಘಟನೆಗಳ ದಾಖಲೆ',
  'No field incidents recorded for this district.':
    'ಈ ನಗರಕ್ಕೆ ಯಾವುದೇ ಕ್ಷೇತ್ರ ಘಟನೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.',
  'HISTORICAL REPLAY': 'ಐತಿಹಾಸಿಕ ಮರುಪರಿಶೀಲನೆ',
  'Observed stress vs High+ probability':
    'ಗಮನಿಸಿದ ಒತ್ತಡ ಮತ್ತು ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸಂಭವನೀಯತೆ',
  'Untouched chronological test period': 'ಬದಲಾಯಿಸದ ಕಾಲಕ್ರಮದ ಪರೀಕ್ಷಾ ಅವಧಿ',
  'Actual HTSI': 'ವಾಸ್ತವ HTSI',
  'Predicted probability': 'ಮುನ್ಸೂಚಿತ ಸಂಭವನೀಯತೆ',
  'ERROR ANALYSIS': 'ದೋಷ ವಿಶ್ಲೇಷಣೆ',
  'Confusion matrix': 'ಗೊಂದಲ ಮ್ಯಾಟ್ರಿಕ್ಸ್',
  'false alarms': 'ತಪ್ಪು ಎಚ್ಚರಿಕೆಗಳು',
  'missed High+ events': 'ತಪ್ಪಿಹೋದ ಹೆಚ್ಚಿನ ಅಪಾಯದ ಘಟನೆಗಳು',
  samples: 'ಮಾದರಿಗಳು',
  'SELECTABLE 2025 EVIDENCE': 'ಆಯ್ಕೆಮಾಡಬಹುದಾದ 2025 ಸಾಕ್ಷ್ಯ',
  'historical case': 'ಐತಿಹಾಸಿಕ ಪ್ರಕರಣ',
  'Choose a real held-out timestamp and inspect the weather, result and model reasoning.':
    'ನೈಜ ಮೀಸಲು ಸಮಯವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಹವಾಮಾನ, ಫಲಿತಾಂಶ ಮತ್ತು ಮಾದರಿಯ ಕಾರಣವನ್ನು ಪರಿಶೀಲಿಸಿ.',
  'Select historical replay case': 'ಐತಿಹಾಸಿಕ ಮರುಪರಿಶೀಲನೆ ಪ್ರಕರಣ ಆಯ್ಕೆಮಾಡಿ',
  'Observed proxy': 'ಗಮನಿಸಿದ ಪ್ರತಿನಿಧಿ ವರ್ಗ',
  'Model result': 'ಮಾದರಿಯ ಫಲಿತಾಂಶ',
  confidence: 'ವಿಶ್ವಾಸ',
  'High+ probability': 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸಂಭವನೀಯತೆ',
  'class matched': 'ವರ್ಗ ಹೊಂದಿಕೆಯಾಗಿದೆ',
  'class mismatch': 'ವರ್ಗ ಹೊಂದಿಕೆಯಾಗಿಲ್ಲ',
  Wind: 'ಗಾಳಿ',
  'Solar load': 'ಸೌರಭಾರ',
  'Why the model selected': 'ಮಾದರಿ ಈ ವರ್ಗವನ್ನು ಏಕೆ ಆಯ್ಕೆಮಾಡಿತು:',
  'this class': 'ಈ ವರ್ಗಕ್ಕೆ',
  'HACKATHON TABLETOP TEST': 'ಹ್ಯಾಕಥಾನ್ ಕಾರ್ಯಸಿದ್ಧತಾ ಪರೀಕ್ಷೆ',
  'Reproducible readiness simulation': 'ಪುನರಾವರ್ತಿಸಬಹುದಾದ ಕಾರ್ಯಸಿದ್ಧತಾ ಅನುಕರಣೆ',
  'A safe substitute for unavailable field testing. It verifies the technical workflow, but does not claim real-user or authority validation.':
    'ಲಭ್ಯವಿಲ್ಲದ ಕ್ಷೇತ್ರ ಪರೀಕ್ಷೆಗೆ ಸುರಕ್ಷಿತ ಪರ್ಯಾಯ. ಇದು ತಾಂತ್ರಿಕ ಕಾರ್ಯವಿಧಾನವನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ; ನೈಜ ಬಳಕೆದಾರ ಅಥವಾ ಪ್ರಾಧಿಕಾರದ ಮಾನ್ಯತೆಯನ್ನು ಹೇಳುವುದಿಲ್ಲ.',
  'Run readiness check': 'ಕಾರ್ಯಸಿದ್ಧತಾ ಪರೀಕ್ಷೆ ನಡೆಸಿ',
  'Live coverage': 'ನೇರ ವ್ಯಾಪ್ತಿ',
  'cities loaded': 'ನಗರಗಳ ದತ್ತಾಂಶ ಲೋಡ್ ಆಗಿದೆ',
  'Forecast workflow': 'ಮುನ್ಸೂಚನೆ ಕಾರ್ಯವಿಧಾನ',
  horizons: 'ಅವಧಿಗಳು',
  'National layers': 'ರಾಷ್ಟ್ರೀಯ ಪದರಗಳು',
  'Historical evidence': 'ಐತಿಹಾಸಿಕ ಸಾಕ್ಷ್ಯ',
  'held-out rows': 'ಮೀಸಲು ಪರೀಕ್ಷಾ ಸಾಲುಗಳು',
  'Alert readiness': 'ಎಚ್ಚರಿಕೆ ಕಾರ್ಯಸಿದ್ಧತೆ',
  'live ·': 'ನೇರ ·',
  'demo channels': 'ಪ್ರದರ್ಶನ ವಾಹಿನಿಗಳು',
  Pass: 'ಉತ್ತೀರ್ಣ',
  Check: 'ಪರಿಶೀಲಿಸಿ',
  'Run this before the SIH presentation to refresh the live data pipeline, all forecast horizons, the 30-city map layers and the historical validation evidence in one repeatable exercise.':
    'SIH ಪ್ರಸ್ತುತಿಗೂ ಮುನ್ನ ಇದನ್ನು ಚಲಾಯಿಸಿ; ನೇರ ದತ್ತಾಂಶ, ಎಲ್ಲಾ ಮುನ್ಸೂಚನೆ ಅವಧಿಗಳು, 30 ನಗರಗಳ ನಕ್ಷೆ ಪದರಗಳು ಮತ್ತು ಐತಿಹಾಸಿಕ ಸಾಕ್ಷ್ಯವನ್ನು ಒಂದೇ ಪುನರಾವರ್ತಿಸಬಹುದಾದ ಪರೀಕ್ಷೆಯಲ್ಲಿ ನವೀಕರಿಸುತ್ತದೆ.',
  'Validation boundary': 'ಮೌಲ್ಯಮಾಪನದ ಮಿತಿ',
  'Chronological held-out evaluation. Coefficients fit on 2022-2023, probability temperature calibrated on 2024, tested once on 2025.':
    'ಕಾಲಕ್ರಮದ ಮೀಸಲು ಮೌಲ್ಯಮಾಪನ. ಗುಣಾಂಕಗಳನ್ನು 2022–2023 ದತ್ತಾಂಶಕ್ಕೆ ಹೊಂದಿಸಿ, 2024ರಲ್ಲಿ ಸಂಭವನೀಯತೆಯನ್ನು ಮಾಪನಾಂಕ ಮಾಡಿ, 2025ರ ದತ್ತಾಂಶದಲ್ಲಿ ಒಮ್ಮೆ ಪರೀಕ್ಷಿಸಲಾಗಿದೆ.',
  'The Emergency row is retained in the matrix, but its 2025 support is zero and therefore no Emergency performance claim is made.':
    'ಮ್ಯಾಟ್ರಿಕ್ಸ್‌ನಲ್ಲಿ ತುರ್ತು ವರ್ಗವನ್ನು ಉಳಿಸಲಾಗಿದೆ; ಆದರೆ 2025ರಲ್ಲಿ ಅದರ ಮಾದರಿಗಳು ಶೂನ್ಯವಾಗಿರುವುದರಿಂದ ತುರ್ತು ವರ್ಗದ ಕಾರ್ಯಕ್ಷಮತೆಯ ಬಗ್ಗೆ ಯಾವುದೇ ಹೇಳಿಕೆ ಮಾಡುವುದಿಲ್ಲ.',
  'PERSISTENT RECORD': 'ಶಾಶ್ವತ ದಾಖಲೆ',
  'Recent observations': 'ಇತ್ತೀಚಿನ ಗಮನಿಕೆಗಳು',
  'stored rows for': 'ಗಾಗಿ ಉಳಿಸಿದ ಸಾಲುಗಳು',
  RH: 'ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ',
  'Refresh the command center to create persistent observations.':
    'ಶಾಶ್ವತ ಗಮನಿಕೆಗಳನ್ನು ರಚಿಸಲು ಕಮಾಂಡ್ ಕೇಂದ್ರವನ್ನು ನವೀಕರಿಸಿ.',
  'PREDICTION TRACK': 'ಮುನ್ಸೂಚನೆ ದಾಖಲೆ',
  'Forecast records': 'ಮುನ್ಸೂಚನೆ ದಾಖಲೆಗಳು',
  'stored horizons for later comparison.': 'ನಂತರ ಹೋಲಿಸಲು ಉಳಿಸಿದ ಮುನ್ಸೂಚನೆ ಅವಧಿಗಳು.',
  horizon: 'ಮುನ್ಸೂಚನೆ ಅವಧಿ',
  'Open a district forecast to create persistent predictions.':
    'ಶಾಶ್ವತ ಮುನ್ಸೂಚನೆಗಳನ್ನು ರಚಿಸಲು ನಗರದ ಮುನ್ಸೂಚನೆಯನ್ನು ತೆರೆಯಿರಿ.',
  'AUTOMATIC ML WATCH': 'ಸ್ವಯಂಚಾಲಿತ ML ಮೇಲ್ವಿಚಾರಣೆ',
  'active forecast warning': 'ಸಕ್ರಿಯ ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆ',
  'active forecast warnings': 'ಸಕ್ರಿಯ ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆಗಳು',
  for: 'ಗಾಗಿ',
  'Created automatically when the model predicts High+ risk with at least 60% High+ probability. Duplicate forecast windows are suppressed.':
    'ಮಾದರಿ ಕನಿಷ್ಠ 60% ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸಂಭವನೀಯತೆಯೊಂದಿಗೆ ಹೆಚ್ಚಿನ ಅಪಾಯವನ್ನು ಮುನ್ಸೂಚಿಸಿದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರಚಿಸಲಾಗುತ್ತದೆ. ನಕಲಿ ಮುನ್ಸೂಚನೆ ಅವಧಿಗಳನ್ನು ತಡೆಯಲಾಗುತ್ತದೆ.',
  'Evaluate forecasts': 'ಮುನ್ಸೂಚನೆಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ',
  valid: 'ಮಾನ್ಯ ಸಮಯ',
  'No automatic High+ warning is active for this district. Evaluate the forecast layers to refresh the warning engine.':
    'ಈ ನಗರಕ್ಕೆ ಯಾವುದೇ ಸ್ವಯಂಚಾಲಿತ ಹೆಚ್ಚಿನ ಅಪಾಯದ ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯವಾಗಿಲ್ಲ. ಎಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆಯನ್ನು ನವೀಕರಿಸಲು ಮುನ್ಸೂಚನೆ ಪದರಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ.',
  'MULTICHANNEL WARNING': 'ಬಹುವಾಹಿನಿ ಎಚ್ಚರಿಕೆ',
  'Alert composer': 'ಎಚ್ಚರಿಕೆ ರಚನೆ',
  'Browser delivery is live. SMS and WhatsApp are safe hackathon previews and do not contact real recipients.':
    'ಬ್ರೌಸರ್ ವಿತರಣೆ ನೇರವಾಗಿದೆ. SMS ಮತ್ತು WhatsApp ಸುರಕ್ಷಿತ ಹ್ಯಾಕಥಾನ್ ಪೂರ್ವವೀಕ್ಷಣೆಗಳು; ನೈಜ ಸ್ವೀಕರಿಸುವವರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸುವುದಿಲ್ಲ.',
  'RISK LEVEL': 'ಅಪಾಯದ ಮಟ್ಟ',
  'DELIVERY CHANNEL': 'ವಿತರಣಾ ವಾಹಿನಿ',
  'Browser notification · live': 'ಬ್ರೌಸರ್ ಸೂಚನೆ · ನೇರ',
  'SMS · demo preview': 'SMS · ಪ್ರದರ್ಶನ ಪೂರ್ವವೀಕ್ಷಣೆ',
  'WhatsApp · demo preview': 'WhatsApp · ಪ್ರದರ್ಶನ ಪೂರ್ವವೀಕ್ಷಣೆ',
  LANGUAGE: 'ಭಾಷೆ',
  English: 'ಇಂಗ್ಲಿಷ್',
  Hindi: 'ಹಿಂದಿ',
  Telugu: 'ತೆಲುಗು',
  Kannada: 'ಕನ್ನಡ',
  'access · live browser delivery': 'ಪ್ರವೇಶ · ನೇರ ಬ್ರೌಸರ್ ವಿತರಣೆ',
  'access · demo-only delivery': 'ಪ್ರವೇಶ · ಪ್ರದರ್ಶನ ವಿತರಣೆ ಮಾತ್ರ',
  'Officer sign-in required': 'ಅಧಿಕಾರಿ ಸೈನ್ ಇನ್ ಅಗತ್ಯ',
  'Browser delivery uses this device’s notification permission and stores the alert in the audit trail.':
    'ಬ್ರೌಸರ್ ವಿತರಣೆಯು ಈ ಸಾಧನದ ಸೂಚನೆ ಅನುಮತಿಯನ್ನು ಬಳಸುತ್ತದೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಯನ್ನು ಪರಿಶೀಲನಾ ದಾಖಲೆಯಲ್ಲಿ ಉಳಿಸುತ್ತದೆ.',
  'This creates and audits a realistic message preview. No phone number, external API, SMS, or WhatsApp message is used.':
    'ಇದು ನೈಜತೆಯ ಸಂದೇಶ ಪೂರ್ವವೀಕ್ಷಣೆಯನ್ನು ರಚಿಸಿ ದಾಖಲಿಸುತ್ತದೆ. ಯಾವುದೇ ಫೋನ್ ಸಂಖ್ಯೆ, ಬಾಹ್ಯ API, SMS ಅಥವಾ WhatsApp ಸಂದೇಶವನ್ನು ಬಳಸುವುದಿಲ್ಲ.',
  'Public visitors can view warnings, but only signed-in officers can send or acknowledge them.':
    'ಸಾರ್ವಜನಿಕರು ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೋಡಬಹುದು; ಸೈನ್ ಇನ್ ಮಾಡಿದ ಅಧಿಕಾರಿಗಳು ಮಾತ್ರ ಅವನ್ನು ಕಳುಹಿಸಲು ಅಥವಾ ಸ್ವೀಕರಿಸಲು ಸಾಧ್ಯ.',
  'Sign in with ChatGPT': 'ChatGPT ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ',
  'Send and record warning': 'ಎಚ್ಚರಿಕೆಯನ್ನು ಕಳುಹಿಸಿ ಮತ್ತು ದಾಖಲಿಸಿ',
  Generate: 'ರಚಿಸಿ',
  demo: 'ಪ್ರದರ್ಶನ',
  'AUDIT TRAIL': 'ಪರಿಶೀಲನಾ ದಾಖಲೆ',
  'alert history': 'ಎಚ್ಚರಿಕೆಗಳ ಇತಿಹಾಸ',
  sent: 'ಕಳುಹಿಸಲಾಗಿದೆ',
  acknowledged: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
  demo_only: 'ಪ್ರದರ್ಶನ ಮಾತ್ರ',
  Acknowledge: 'ಸ್ವೀಕರಿಸಿ',
  'No warnings have been sent for this district.':
    'ಈ ನಗರಕ್ಕೆ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲಾಗಿಲ್ಲ.',
  'Privacy and data use': 'ಗೌಪ್ಯತೆ ಮತ್ತು ದತ್ತಾಂಶ ಬಳಕೆ',
  'System status': 'ವ್ಯವಸ್ಥೆಯ ಸ್ಥಿತಿ',
  'Weather data by Open-Meteo': 'Open-Meteo ಹವಾಮಾನ ದತ್ತಾಂಶ',
  'ThermoWatch is an early-warning and decision-support prototype. It is not a medical service or an official government warning system.':
    'ThermoWatch ಮುಂಚಿತ ಎಚ್ಚರಿಕೆ ಮತ್ತು ನಿರ್ಧಾರ ಸಹಾಯದ ಮಾದರಿ ವ್ಯವಸ್ಥೆ. ಇದು ವೈದ್ಯಕೀಯ ಸೇವೆ ಅಥವಾ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಎಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆಯಲ್ಲ.',
  'Information stored': 'ಉಳಿಸಲಾಗುವ ಮಾಹಿತಿ',
  'The system stores weather observations, model predictions, warning records, alert acknowledgements and community incident reports. A reporter name is optional; anonymous reporting is the default. Do not enter medical records, government identifiers, phone numbers or other unnecessary personal information.':
    'ವ್ಯವಸ್ಥೆಯು ಹವಾಮಾನ ಗಮನಿಕೆಗಳು, ಮಾದರಿ ಮುನ್ಸೂಚನೆಗಳು, ಎಚ್ಚರಿಕೆ ದಾಖಲೆಗಳು, ಸ್ವೀಕೃತಿಗಳು ಮತ್ತು ಸಮುದಾಯ ಘಟನೆ ವರದಿಗಳನ್ನು ಉಳಿಸುತ್ತದೆ. ವರದಿದಾರರ ಹೆಸರು ಐಚ್ಛಿಕ; ಅನಾಮಧೇಯ ವರದಿ ಪೂರ್ವನಿಯೋಜಿತವಾಗಿದೆ. ವೈದ್ಯಕೀಯ ದಾಖಲೆ, ಸರ್ಕಾರಿ ಗುರುತು, ಫೋನ್ ಸಂಖ್ಯೆ ಅಥವಾ ಅನಗತ್ಯ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ನಮೂದಿಸಬೇಡಿ.',
  'Identity and permissions': 'ಗುರುತು ಮತ್ತು ಅನುಮತಿಗಳು',
  'Public visitors can view operational information. Authority actions use the signed-in ChatGPT user identifier supplied by the hosting platform. Audit records store the actor identifier and role, not passwords or authentication tokens.':
    'ಸಾರ್ವಜನಿಕರು ಕಾರ್ಯಾಚರಣೆಯ ಮಾಹಿತಿಯನ್ನು ನೋಡಬಹುದು. ಪ್ರಾಧಿಕಾರದ ಕ್ರಮಗಳು ಹೋಸ್ಟಿಂಗ್ ವೇದಿಕೆಯು ನೀಡುವ ಸೈನ್ ಇನ್ ಮಾಡಿದ ChatGPT ಬಳಕೆದಾರ ಗುರುತನ್ನು ಬಳಸುತ್ತವೆ. ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳಲ್ಲಿ ಬಳಕೆದಾರ ಗುರುತು ಮತ್ತು ಪಾತ್ರ ಮಾತ್ರ ಉಳಿಯುತ್ತದೆ; ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ದೃಢೀಕರಣ ಟೋಕನ್ ಉಳಿಯುವುದಿಲ್ಲ.',
  'Purpose and sharing': 'ಉದ್ದೇಶ ಮತ್ತು ಹಂಚಿಕೆ',
  'Data is used to demonstrate heat-risk monitoring, response coordination, validation and accountability. ThermoWatch does not sell personal information. Weather requests are sent to Open-Meteo, and facility searches are sent to OpenStreetMap services without incident descriptions or reporter names.':
    'ಉಷ್ಣ ಅಪಾಯ ಮೇಲ್ವಿಚಾರಣೆ, ಪ್ರತಿಕ್ರಿಯಾ ಸಮನ್ವಯ, ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆಯನ್ನು ಪ್ರದರ್ಶಿಸಲು ದತ್ತಾಂಶವನ್ನು ಬಳಸಲಾಗುತ್ತದೆ. ThermoWatch ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಮಾರುವುದಿಲ್ಲ. ಹವಾಮಾನ ವಿನಂತಿಗಳನ್ನು Open-Meteoಗೆ ಮತ್ತು ಸೌಲಭ್ಯ ಹುಡುಕಾಟವನ್ನು ಘಟನೆ ವಿವರ ಅಥವಾ ವರದಿದಾರರ ಹೆಸರಿಲ್ಲದೆ OpenStreetMapಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.',
  'Local assistant and voice': 'ಸ್ಥಳೀಯ ಸಹಾಯಕ ಮತ್ತು ಧ್ವನಿ',
  "Assistant answers are created in the browser from the heat-risk data already shown on screen. Chat messages and audio are not stored by ThermoWatch. Optional speech recognition and read-aloud use browser-provided voice services, whose processing and regional-language availability depend on the user's browser and device. Users can always use text without granting microphone access.":
    'ಪರದೆಯಲ್ಲಿ ಈಗಾಗಲೇ ತೋರಿಸಿರುವ ಉಷ್ಣ ಅಪಾಯದ ದತ್ತಾಂಶದಿಂದ ಸಹಾಯಕ ಉತ್ತರಗಳನ್ನು ಬ್ರೌಸರ್‌ನಲ್ಲೇ ರಚಿಸಲಾಗುತ್ತದೆ. ಚಾಟ್ ಸಂದೇಶಗಳು ಮತ್ತು ಧ್ವನಿಯನ್ನು ThermoWatch ಉಳಿಸುವುದಿಲ್ಲ. ಐಚ್ಛಿಕ ಮಾತು ಗುರುತಿಸುವಿಕೆ ಮತ್ತು ಓದಿ ಹೇಳುವಿಕೆ ಬ್ರೌಸರ್‌ನ ಧ್ವನಿ ಸೇವೆಗಳನ್ನು ಬಳಸುತ್ತವೆ; ಅವುಗಳ ಕಾರ್ಯವಿಧಾನ ಮತ್ತು ಪ್ರಾದೇಶಿಕ ಭಾಷೆಯ ಲಭ್ಯತೆ ಬಳಕೆದಾರರ ಬ್ರೌಸರ್ ಹಾಗೂ ಸಾಧನವನ್ನು ಅವಲಂಬಿಸುತ್ತದೆ. ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಯಿಲ್ಲದೇ ಪಠ್ಯವನ್ನು ಸದಾ ಬಳಸಬಹುದು.',
  'Retention and deletion': 'ಉಳಿಕೆ ಮತ್ತು ಅಳಿಸುವಿಕೆ',
  'Prototype records are retained for the duration of the SIH evaluation so the audit trail can be demonstrated. Before any field deployment, the responsible authority must approve a time-limited retention schedule, deletion process and legal basis appropriate to its jurisdiction.':
    'ಪರಿಶೀಲನಾ ದಾಖಲೆಯನ್ನು ಪ್ರದರ್ಶಿಸಲು SIH ಮೌಲ್ಯಮಾಪನದ ಅವಧಿಯಲ್ಲಿ ಮಾದರಿ ದಾಖಲೆಗಳನ್ನು ಉಳಿಸಲಾಗುತ್ತದೆ. ಕ್ಷೇತ್ರ ಬಳಕೆಗೆ ಮುನ್ನ ಸಂಬಂಧಿತ ಪ್ರಾಧಿಕಾರವು ಅವಧಿ-ಮಿತಿಯ ಉಳಿಕೆ ವೇಳಾಪಟ್ಟಿ, ಅಳಿಸುವಿಕೆ ವಿಧಾನ ಮತ್ತು ಸೂಕ್ತ ಕಾನೂನು ಆಧಾರವನ್ನು ಅನುಮೋದಿಸಬೇಕು.',
  'Safety boundary': 'ಸುರಕ್ಷತಾ ಮಿತಿ',
  'HTSI and ML predictions support decisions but do not diagnose illness. Follow official IMD, NDMA, health-department and emergency guidance when available.':
    'HTSI ಮತ್ತು ML ಮುನ್ಸೂಚನೆಗಳು ನಿರ್ಧಾರಕ್ಕೆ ನೆರವಾಗುತ್ತವೆ; ರೋಗನಿರ್ಣಯ ಮಾಡುವುದಿಲ್ಲ. ಲಭ್ಯವಿರುವಾಗ ಅಧಿಕೃತ IMD, NDMA, ಆರೋಗ್ಯ ಇಲಾಖೆ ಮತ್ತು ತುರ್ತು ಮಾರ್ಗದರ್ಶನವನ್ನು ಅನುಸರಿಸಿ.',
  'Return to ThermoWatch': 'ThermoWatchಗೆ ಹಿಂದಿರುಗಿ',
  'Offline mode: cached public weather and forecast views remain available. Record submission and authority actions require a connection.':
    'ಆಫ್‌ಲೈನ್ ಸ್ಥಿತಿ: ಉಳಿಸಿದ ಸಾರ್ವಜನಿಕ ಹವಾಮಾನ ಮತ್ತು ಮುನ್ಸೂಚನೆ ನೋಟಗಳು ಲಭ್ಯವಿವೆ. ದಾಖಲೆ ಸಲ್ಲಿಕೆ ಮತ್ತು ಪ್ರಾಧಿಕಾರದ ಕ್ರಮಗಳಿಗೆ ಸಂಪರ್ಕ ಅಗತ್ಯ.',
  'Live Open-Meteo connected': 'ನೇರ Open-Meteo ಸಂಪರ್ಕಿತವಾಗಿದೆ',
  'Resilient demonstration data': 'ಸ್ಥಿರ ಪ್ರದರ್ಶನ ದತ್ತಾಂಶ',
  'LIVE OVERVIEW': 'ನೇರ ಅವಲೋಕನ',
  FORECAST: 'ಮುನ್ಸೂಚನೆ',
  MAP: 'ನಕ್ಷೆ',
  MODEL: 'ಮಾದರಿ',
  AUTHORITY: 'ಪ್ರಾಧಿಕಾರ',
  RESPONSE: 'ಪ್ರತಿಕ್ರಿಯೆ',
  VALIDATION: 'ಮೌಲ್ಯಮಾಪನ',
  HISTORY: 'ಇತಿಹಾಸ',
  ALERTS: 'ಎಚ್ಚರಿಕೆಗಳು',
  INDIA: 'ಭಾರತ',
  Mon: 'ಸೋಮ',
  Tue: 'ಮಂಗಳ',
  Wed: 'ಬುಧ',
  Thu: 'ಗುರು',
  Fri: 'ಶುಕ್ರ',
  Sat: 'ಶನಿ',
  Sun: 'ಭಾನು',
  AM: 'ಪೂರ್ವಾಹ್ನ',
  PM: 'ಅಪರಾಹ್ನ',
  am: 'ಪೂರ್ವಾಹ್ನ',
  pm: 'ಅಪರಾಹ್ನ',
  H: 'ಗಂ',
  h: 'ಗಂ',
  open: 'ಮುಕ್ತ',
  monitoring: 'ಮೇಲ್ವಿಚಾರಣೆ',
  resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
  admin: 'ನಿರ್ವಾಹಕ',
  officer: 'ಅಧಿಕಾರಿ',
  public: 'ಸಾರ್ವಜನಿಕ',
  browser: 'ಬ್ರೌಸರ್',
  'open-meteo': 'Open-Meteo',
  'heat illness': 'ಬಿಸಿಯಿಂದ ಉಂಟಾದ ಅಸ್ವಸ್ಥತೆ',
  'water shortage': 'ನೀರಿನ ಕೊರತೆ',
  'power outage': 'ವಿದ್ಯುತ್ ವ್ಯತ್ಯಯ',
  'cooling centre issue': 'ತಂಪು ಕೇಂದ್ರದ ಸಮಸ್ಯೆ',
  'outdoor worker exposure': 'ಹೊರಾಂಗಣ ಕಾರ್ಮಿಕರ ಬಿಸಿ ಸಂಪರ್ಕ',
  'resilient-fallback': 'ಸ್ಥಿರ-ಪರ್ಯಾಯ ದತ್ತಾಂಶ',
  'Saved records could not be loaded.': 'ಉಳಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Live dashboard unavailable': 'ನೇರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲಭ್ಯವಿಲ್ಲ',
  'Forecast map unavailable': 'ಮುನ್ಸೂಚನೆ ನಕ್ಷೆ ಲಭ್ಯವಿಲ್ಲ',
  'District detail unavailable': 'ನಗರದ ವಿವರ ಲಭ್ಯವಿಲ್ಲ',
  'Screening failed': 'ಅಪಾಯ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ',
  'Incident could not be saved': 'ಘಟನೆಯನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
  'Alert could not be sent': 'ಎಚ್ಚರಿಕೆಯನ್ನು ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
  'Hackathon readiness simulation completed using live APIs, forecast layers and stored model evidence.':
    'ನೇರ APIಗಳು, ಮುನ್ಸೂಚನೆ ಪದರಗಳು ಮತ್ತು ಉಳಿಸಿದ ಮಾದರಿ ಸಾಕ್ಷ್ಯವನ್ನು ಬಳಸಿ ಹ್ಯಾಕಥಾನ್ ಕಾರ್ಯಸಿದ್ಧತಾ ಅನುಕರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ.',
  'The readiness simulation could not complete every check.':
    'ಕಾರ್ಯಸಿದ್ಧತಾ ಅನುಕರಣೆಯ ಎಲ್ಲಾ ಪರಿಶೀಲನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  OPERATIONS: 'ಕಾರ್ಯಾಚರಣೆಗಳು',
  Model: 'ಮಾದರಿ',
  India: 'ಭಾರತ',
  'Sign out': 'ಸೈನ್ ಔಟ್',
  'Interface language': 'ಇಂಟರ್ಫೇಸ್ ಭಾಷೆ',
  'Select monitoring district': 'ಮೇಲ್ವಿಚಾರಣೆಯ ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
  'Open navigation': 'ನ್ಯಾವಿಗೇಶನ್ ತೆರೆಯಿರಿ',
  'Close navigation': 'ನ್ಯಾವಿಗೇಶನ್ ಮುಚ್ಚಿರಿ',
  'Close navigation overlay': 'ನ್ಯಾವಿಗೇಶನ್ ಪದರ ಮುಚ್ಚಿರಿ',
  'Dismiss error': 'ದೋಷ ಸಂದೇಶ ಮುಚ್ಚಿರಿ',
  'Main navigation': 'ಮುಖ್ಯ ನ್ಯಾವಿಗೇಶನ್',
  'Loading live intelligence': 'ನೇರ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ',
  'Local decision support only · not an emergency service or medical diagnosis.':
    'ಸ್ಥಳೀಯ ನಿರ್ಧಾರ ಸಹಾಯ ಮಾತ್ರ · ತುರ್ತು ಸೇವೆ ಅಥವಾ ವೈದ್ಯಕೀಯ ನಿರ್ಣಯವಲ್ಲ.',
  Close: 'ಮುಚ್ಚಿರಿ',
  'Close local assistant': 'ಸ್ಥಳೀಯ ಸಹಾಯಕವನ್ನು ಮುಚ್ಚಿರಿ',
  'Close local heat assistant': 'ಸ್ಥಳೀಯ ಉಷ್ಣ ಸಹಾಯಕವನ್ನು ಮುಚ್ಚಿರಿ',
  'Use voice input': 'ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬಳಸಿ',
  'Read response aloud': 'ಉತ್ತರವನ್ನು ಜೋರಾಗಿ ಓದಿ',
  'Send question': 'ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ',
  Delhi: 'ದೆಹಲಿ',
  Jaipur: 'ಜೈಪುರ',
  Ahmedabad: 'ಅಹಮದಾಬಾದ್',
  Nagpur: 'ನಾಗಪುರ',
  Hyderabad: 'ಹೈದರಾಬಾದ್',
  Patna: 'ಪಾಟ್ನಾ',
  Lucknow: 'ಲಖನೌ',
  Bhopal: 'ಭೋಪಾಲ್',
  Bhubaneswar: 'ಭುವನೇಶ್ವರ',
  Chandigarh: 'ಚಂಡೀಗಢ',
  Bikaner: 'ಬಿಕಾನೇರ್',
  Jodhpur: 'ಜೋಧ್‌ಪುರ',
  Varanasi: 'ವಾರಾಣಸಿ',
  Prayagraj: 'ಪ್ರಯಾಗರಾಜ್',
  Gwalior: 'ಗ್ವಾಲಿಯರ್',
  Aurangabad: 'ಔರಂಗಾಬಾದ್',
  Nanded: 'ನಾಂದೇಡ್',
  Raipur: 'ರಾಯ್ಪುರ',
  Ranchi: 'ರಾಂಚಿ',
  Gaya: 'ಗಯಾ',
  Srinagar: 'ಶ್ರೀನಗರ',
  Dehradun: 'ಡೆಹ್ರಾಡೂನ್',
  Guwahati: 'ಗುವಾಹಟಿ',
  Kolkata: 'ಕೋಲ್ಕತ್ತಾ',
  Mumbai: 'ಮುಂಬೈ',
  Pune: 'ಪುಣೆ',
  Bengaluru: 'ಬೆಂಗಳೂರು',
  Chennai: 'ಚೆನ್ನೈ',
  Kochi: 'ಕೊಚ್ಚಿ',
  Visakhapatnam: 'ವಿಶಾಖಪಟ್ಟಣಂ',
};

const entries = Object.entries(translations).sort(
  ([left], [right]) => right.length - left.length,
);

export function translateKannada(value: string) {
  let translated = value
    .replace(/(\d+)-hour warning/g, '$1 ಗಂಟೆಗಳ ಎಚ್ಚರಿಕೆ')
    .replace(/India (\d+)-hour forecast map/g, 'ಭಾರತದ $1 ಗಂಟೆಗಳ ಮುನ್ಸೂಚನೆ ನಕ್ಷೆ')
    .replace(/Forecast \+(\d+)h/g, 'ಮುನ್ಸೂಚನೆ +$1ಗಂ')
    .replace(/\+(\d+)h/g, '+$1ಗಂ')
    .replace(/(\d+)h horizon/g, '$1ಗಂ ಮುನ್ಸೂಚನೆ ಅವಧಿ')
    .replace(/(\d+) stored rows for (.+)\./g, '$2ಗಾಗಿ $1 ಸಾಲುಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.')
    .replace(
      /(\d+) stored horizons for later comparison\./g,
      'ನಂತರದ ಹೋಲಿಕೆಗಾಗಿ $1 ಮುನ್ಸೂಚನೆ ಅವಧಿಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.',
    )
    .replace(/(\d+) chronological holdout rows/g, '$1 ಕಾಲಕ್ರಮದ ಮೀಸಲು ಸಾಲುಗಳು')
    .replace(/(\d[\d,]*) held-out 2025 rows/g, '$1 ಮೀಸಲು 2025 ಪರೀಕ್ಷಾ ಸಾಲುಗಳು')
    .replace(/(\d+) monitored districts/g, '$1 ಮೇಲ್ವಿಚಾರಣೆಯ ನಗರಗಳು')
    .replace(/(\d+) samples/g, '$1 ಮಾದರಿಗಳು')
    .replace(/(\d+)% confidence/g, '$1% ವಿಶ್ವಾಸ')
    .replace(/(\d+)% humidity/g, '$1% ಆರ್ದ್ರತೆ')
    .replace(/(\d+) active forecast warnings? for (.+)/g, '$2ಗಾಗಿ $1 ಸಕ್ರಿಯ ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆಗಳು')
    .replace(/Forecast records/g, 'ಮುನ್ಸೂಚನೆ ದಾಖಲೆಗಳು')
    .replace(/Recent observations/g, 'ಇತ್ತೀಚಿನ ಗಮನಿಕೆಗಳು');
  for (const [english, kannada] of entries) {
    if (/^[A-Za-z]+$/.test(english)) {
      translated = translated.replace(
        new RegExp(`\\b${english}\\b`, 'g'),
        kannada,
      );
    } else {
      translated = translated.replaceAll(english, kannada);
    }
  }
  return translated.replaceAll(' to ', ' ರಿಂದ ');
}

export function StoredKannadaLocalizer({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setEnabled(
          window.localStorage.getItem('thermowatch-language') === 'kn',
        ),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  return <KannadaLocalizer enabled={enabled}>{children}</KannadaLocalizer>;
}

const translatedAttributes = ['aria-label', 'placeholder', 'title'];

export function KannadaLocalizer({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!enabled || !rootRef.current) return;
    const root = rootRef.current;
    const originals = new Map<Text, string>();
    const lastTranslations = new Map<Text, string>();
    const attributeOriginals = new Map<Element, Map<string, string>>();
    const attributeTranslations = new Map<Element, Map<string, string>>();

    const translateTextNode = (node: Text) => {
      const current = node.data;
      if (lastTranslations.get(node) === current) return;
      const translated = translateKannada(current);
      if (translated !== current) {
        originals.set(node, current);
        lastTranslations.set(node, translated);
        node.data = translated;
      }
    };

    const translateElement = (element: Element) => {
      for (const attribute of translatedAttributes) {
        const current = element.getAttribute(attribute);
        if (!current) continue;
        const last = attributeTranslations.get(element)?.get(attribute);
        if (last === current) continue;
        const translated = translateKannada(current);
        if (translated !== current) {
          let saved = attributeOriginals.get(element);
          if (!saved) {
            saved = new Map();
            attributeOriginals.set(element, saved);
          }
          saved.set(attribute, current);
          let translatedMap = attributeTranslations.get(element);
          if (!translatedMap) {
            translatedMap = new Map();
            attributeTranslations.set(element, translatedMap);
          }
          translatedMap.set(attribute, translated);
          element.setAttribute(attribute, translated);
        }
      }
    };

    const translateTree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text);
      if (node.nodeType === Node.ELEMENT_NODE)
        translateElement(node as Element);
      const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      );
      let current = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE)
          translateTextNode(current as Text);
        else translateElement(current as Element);
        current = walker.nextNode();
      }
    };

    translateTree(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData')
          translateTextNode(mutation.target as Text);
        if (mutation.type === 'attributes')
          translateElement(mutation.target as Element);
        mutation.addedNodes.forEach(translateTree);
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes,
    });

    return () => {
      observer.disconnect();
      originals.forEach((original, node) => {
        if (node.isConnected && node.data === lastTranslations.get(node))
          node.data = original;
      });
      attributeOriginals.forEach((attributes, element) => {
        if (!element.isConnected) return;
        attributes.forEach((original, attribute) => {
          if (
            element.getAttribute(attribute) ===
            attributeTranslations.get(element)?.get(attribute)
          )
            element.setAttribute(attribute, original);
        });
      });
    };
  }, [enabled]);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
