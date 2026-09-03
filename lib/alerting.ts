export const ALERT_LANGUAGES = ['en', 'hi', 'te', 'kn'] as const;
export type AlertLanguage = (typeof ALERT_LANGUAGES)[number];

export const ALERT_CHANNELS = ['browser', 'sms', 'whatsapp'] as const;
export type AlertChannel = (typeof ALERT_CHANNELS)[number];

const templates: Record<
  AlertLanguage,
  (district: string, risk: string) => string
> = {
  en: (district, risk) =>
    `${risk} heat-risk warning for ${district}. Avoid peak-hour exposure, stay hydrated and check vulnerable people.`,
  hi: (district, risk) =>
    `${district} के लिए ${risk} गर्मी जोखिम चेतावनी। दोपहर की गर्मी से बचें, पानी पीते रहें और कमजोर लोगों की सहायता करें।`,
  te: (district, risk) =>
    `${district}కు ${risk} వేడి ప్రమాద హెచ్చరిక. మధ్యాహ్న వేడిని నివారించండి, నీరు తాగండి మరియు బలహీనులకు సహాయం చేయండి.`,
  kn: (district, risk) =>
    `${district}ಗೆ ${risk} ಉಷ್ಣ ಅಪಾಯದ ಎಚ್ಚರಿಕೆ. ಗರಿಷ್ಠ ಬಿಸಿಯ ಸಮಯದಲ್ಲಿ ಹೊರಗೆ ಹೋಗುವುದನ್ನು ತಪ್ಪಿಸಿ, ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ದುರ್ಬಲ ವ್ಯಕ್ತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`,
};

export function isAlertLanguage(value: string): value is AlertLanguage {
  return ALERT_LANGUAGES.includes(value as AlertLanguage);
}

export function isAlertChannel(value: string): value is AlertChannel {
  return ALERT_CHANNELS.includes(value as AlertChannel);
}

export function buildAlertMessage(
  language: AlertLanguage,
  district: string,
  risk: string,
) {
  return templates[language](district, risk);
}

export function alertDeliveryMode(channel: AlertChannel) {
  return channel === 'browser' ? 'live' : 'demo';
}
