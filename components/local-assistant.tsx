'use client';

import { useMemo, useRef, useState } from 'react';
import { Bot, Mic, Send, Volume2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type AssistantLanguage = 'en' | 'hi' | 'te' | 'kn';

type AssistantContext = {
  district: string;
  risk: string;
  htsi: number;
  temperature: number;
  humidity: number;
  highRiskProbability?: number;
  forecastRisk?: string;
};

type Message = { id: number; from: 'assistant' | 'user'; text: string };

type RecognitionResult = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

const locale: Record<AssistantLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

const copy: Record<
  AssistantLanguage,
  {
    title: string;
    subtitle: string;
    welcome: string;
    placeholder: string;
    listening: string;
    voiceUnavailable: string;
    prompt: string;
    quick: string[];
  }
> = {
  en: {
    title: 'Local heat assistant',
    subtitle: 'Text + regional voice',
    welcome:
      'Ask about the selected city’s heat risk, forecast, hydration or emergency action.',
    placeholder: 'Ask a heat-safety question…',
    listening: 'Listening… speak now',
    voiceUnavailable: 'Voice input is unavailable in this browser. Text chat still works.',
    prompt: 'How can I help with local heat safety?',
    quick: ['Current risk', 'What should I do?', 'Emergency help'],
  },
  hi: {
    title: 'स्थानीय गर्मी सहायक',
    subtitle: 'टेक्स्ट + क्षेत्रीय आवाज़',
    welcome:
      'चुने हुए शहर के गर्मी जोखिम, पूर्वानुमान, पानी या आपातकालीन कार्रवाई के बारे में पूछें।',
    placeholder: 'गर्मी से सुरक्षा का प्रश्न पूछें…',
    listening: 'सुन रहा है… अब बोलें',
    voiceUnavailable: 'इस ब्राउज़र में आवाज़ उपलब्ध नहीं है। टेक्स्ट चैट काम करेगी।',
    prompt: 'स्थानीय गर्मी सुरक्षा में मैं कैसे मदद करूँ?',
    quick: ['वर्तमान जोखिम', 'मुझे क्या करना चाहिए?', 'आपातकालीन मदद'],
  },
  te: {
    title: 'స్థానిక వేడి సహాయకుడు',
    subtitle: 'టెక్స్ట్ + ప్రాంతీయ వాయిస్',
    welcome:
      'ఎంచుకున్న నగరంలోని వేడి ప్రమాదం, అంచనా, నీరు లేదా అత్యవసర చర్య గురించి అడగండి.',
    placeholder: 'వేడి భద్రత ప్రశ్న అడగండి…',
    listening: 'వింటోంది… ఇప్పుడు మాట్లాడండి',
    voiceUnavailable: 'ఈ బ్రౌజర్‌లో వాయిస్ లేదు. టెక్స్ట్ చాట్ పనిచేస్తుంది.',
    prompt: 'స్థానిక వేడి భద్రతలో నేను ఎలా సహాయపడగలను?',
    quick: ['ప్రస్తుత ప్రమాదం', 'నేను ఏమి చేయాలి?', 'అత్యవసర సహాయం'],
  },
  kn: {
    title: 'ಸ್ಥಳೀಯ ಉಷ್ಣ ಸಹಾಯಕ',
    subtitle: 'ಪಠ್ಯ + ಪ್ರಾದೇಶಿಕ ಧ್ವನಿ',
    welcome:
      'ಆಯ್ಕೆ ಮಾಡಿದ ನಗರದ ಉಷ್ಣ ಅಪಾಯ, ಮುನ್ಸೂಚನೆ, ನೀರು ಅಥವಾ ತುರ್ತು ಕ್ರಮದ ಬಗ್ಗೆ ಕೇಳಿ.',
    placeholder: 'ಉಷ್ಣ ಸುರಕ್ಷತಾ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ…',
    listening: 'ಆಲಿಸುತ್ತಿದೆ… ಈಗ ಮಾತನಾಡಿ',
    voiceUnavailable: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ. ಪಠ್ಯ ಚಾಟ್ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.',
    prompt: 'ಸ್ಥಳೀಯ ಉಷ್ಣ ಸುರಕ್ಷತೆಯಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    quick: ['ಪ್ರಸ್ತುತ ಅಪಾಯ', 'ನಾನು ಏನು ಮಾಡಬೇಕು?', 'ತುರ್ತು ಸಹಾಯ'],
  },
};

const actionCopy: Record<AssistantLanguage, Record<string, string>> = {
  en: {
    Low: 'Continue normal activity with regular water breaks.',
    Moderate: 'Reduce midday exposure, drink water often and check vulnerable people.',
    High: 'Avoid strenuous outdoor work from 12–4 PM and use a cool indoor space.',
    Extreme: 'Activate heat-action measures now and move vulnerable people to cooling support.',
    Emergency: 'Stop unsafe exposure, seek urgent medical help and contact local emergency services.',
  },
  hi: {
    Low: 'सामान्य गतिविधि जारी रखें और नियमित रूप से पानी पिएँ।',
    Moderate: 'दोपहर में बाहर कम रहें, पानी पिएँ और कमजोर लोगों की जाँच करें।',
    High: 'दोपहर 12–4 बजे कठिन बाहरी काम से बचें और ठंडी जगह पर रहें।',
    Extreme: 'हीट-एक्शन उपाय तुरंत शुरू करें और कमजोर लोगों को ठंडी जगह पहुँचाएँ।',
    Emergency: 'गर्मी का संपर्क रोकें, तुरंत चिकित्सा सहायता लें और स्थानीय आपात सेवा से संपर्क करें।',
  },
  te: {
    Low: 'సాధారణ కార్యకలాపాలు కొనసాగిస్తూ తరచుగా నీరు తాగండి.',
    Moderate: 'మధ్యాహ్నం బయట ఉండటం తగ్గించి, నీరు తాగుతూ బలహీనులను గమనించండి.',
    High: 'మధ్యాహ్నం 12–4 మధ్య కఠినమైన బయటి పనిని నివారించి చల్లని ప్రదేశంలో ఉండండి.',
    Extreme: 'వేడి చర్యలను వెంటనే ప్రారంభించి బలహీనులను కూలింగ్ సహాయానికి తరలించండి.',
    Emergency: 'వేడి ప్రభావాన్ని ఆపి, వెంటనే వైద్య సహాయం తీసుకొని స్థానిక అత్యవసర సేవలను సంప్రదించండి.',
  },
  kn: {
    Low: 'ಸಾಮಾನ್ಯ ಚಟುವಟಿಕೆಯನ್ನು ಮುಂದುವರಿಸಿ ಮತ್ತು ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ.',
    Moderate: 'ಮಧ್ಯಾಹ್ನದ ಬಿಸಿಗೆ ಒಡ್ಡಿಕೊಳ್ಳುವುದನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ದುರ್ಬಲರನ್ನು ಗಮನಿಸಿ.',
    High: 'ಮಧ್ಯಾಹ್ನ 12–4ರ ನಡುವೆ ಕಠಿಣ ಹೊರಾಂಗಣ ಕೆಲಸ ತಪ್ಪಿಸಿ ಮತ್ತು ತಂಪಾದ ಸ್ಥಳದಲ್ಲಿರಿ.',
    Extreme: 'ಉಷ್ಣ ಕ್ರಿಯಾ ಕ್ರಮಗಳನ್ನು ಈಗಲೇ ಆರಂಭಿಸಿ ಮತ್ತು ದುರ್ಬಲರನ್ನು ತಂಪು ಸಹಾಯ ಕೇಂದ್ರಕ್ಕೆ ಕರೆದೊಯ್ಯಿರಿ.',
    Emergency: 'ಬಿಸಿಗೆ ಒಡ್ಡಿಕೊಳ್ಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ, ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆದು ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  },
};

function includesAny(question: string, words: string[]) {
  return words.some((word) => question.includes(word));
}

function localAnswer(
  question: string,
  context: AssistantContext,
  language: AssistantLanguage,
) {
  const q = question.toLocaleLowerCase(locale[language]);
  const action = actionCopy[language][context.risk] ?? actionCopy[language].High;
  const probability = Math.round(context.highRiskProbability ?? 0);

  if (
    includesAny(q, [
      'emergency',
      'faint',
      'unconscious',
      'आपात',
      'बेहोश',
      'అత్యవసర',
      'స్పృహ',
      'ತುರ್ತು',
      'ಪ್ರಜ್ಞೆ',
    ])
  ) {
    return actionCopy[language].Emergency;
  }
  if (
    includesAny(q, [
      'forecast',
      'tomorrow',
      'next',
      'पूर्वानुमान',
      'कल',
      'అంచనా',
      'రేపు',
      'ಮುನ್ಸೂಚನೆ',
      'ನಾಳೆ',
    ])
  ) {
    const forecastRisk = context.forecastRisk ?? context.risk;
    const replies = {
      en: `${context.district}'s next warning horizon is ${forecastRisk}. The current High+ probability is ${probability}%. Recheck the forecast map before planning outdoor work.`,
      hi: `${context.district} का अगला चेतावनी स्तर ${forecastRisk} है। वर्तमान High+ संभावना ${probability}% है। बाहरी काम की योजना से पहले पूर्वानुमान मानचित्र देखें।`,
      te: `${context.district} తదుపరి హెచ్చరిక స్థాయి ${forecastRisk}. ప్రస్తుత High+ సంభావ్యత ${probability}%. బయటి పనికి ముందు అంచనా పటాన్ని చూడండి.`,
      kn: `${context.district}ನ ಮುಂದಿನ ಎಚ್ಚರಿಕೆ ಮಟ್ಟ ${forecastRisk}. ಪ್ರಸ್ತುತ High+ ಸಂಭವನೀಯತೆ ${probability}%. ಹೊರಾಂಗಣ ಕೆಲಸದ ಮೊದಲು ಮುನ್ಸೂಚನೆ ನಕ್ಷೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.`,
    };
    return replies[language];
  }
  if (
    includesAny(q, [
      'water',
      'drink',
      'hydrate',
      'पानी',
      'నీరు',
      'ನೀರು',
    ])
  ) {
    return {
      en: 'Drink water regularly before you feel thirsty. Use ORS when advised, avoid excess alcohol, and seek medical help for confusion, fainting or very hot dry skin.',
      hi: 'प्यास लगने से पहले नियमित पानी पिएँ। सलाह पर ORS लें और भ्रम, बेहोशी या बहुत गर्म सूखी त्वचा होने पर चिकित्सा सहायता लें।',
      te: 'దాహం వేయకముందే తరచుగా నీరు తాగండి. సూచన ప్రకారం ORS తీసుకోండి; అయోమయం, స్పృహ కోల్పోవడం లేదా చాలా వేడి పొడి చర్మం ఉంటే వైద్య సహాయం పొందండి.',
      kn: 'ಬಾಯಾರಿಕೆಯಾಗುವ ಮೊದಲು ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ. ಸಲಹೆಯಂತೆ ORS ಬಳಸಿ; ಗೊಂದಲ, ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು ಅಥವಾ ತುಂಬಾ ಬಿಸಿ ಒಣ ಚರ್ಮ ಇದ್ದರೆ ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಿರಿ.',
    }[language];
  }
  if (
    includesAny(q, [
      'risk',
      'current',
      'status',
      'temperature',
      'जोखिम',
      'स्थिति',
      'ప్రమాదం',
      'స్థితి',
      'ಅಪಾಯ',
      'ಸ್ಥಿತಿ',
    ])
  ) {
    const replies = {
      en: `${context.district} is currently ${context.risk} risk with HTSI ${context.htsi}, ${context.temperature}°C and ${context.humidity}% humidity. ${action}`,
      hi: `${context.district} में वर्तमान जोखिम ${context.risk} है। HTSI ${context.htsi}, तापमान ${context.temperature}°C और आर्द्रता ${context.humidity}% है। ${action}`,
      te: `${context.district}లో ప్రస్తుత ప్రమాదం ${context.risk}. HTSI ${context.htsi}, ఉష్ణోగ్రత ${context.temperature}°C, తేమ ${context.humidity}%. ${action}`,
      kn: `${context.district}ನಲ್ಲಿ ಪ್ರಸ್ತುತ ಅಪಾಯ ${context.risk}. HTSI ${context.htsi}, ತಾಪಮಾನ ${context.temperature}°C ಮತ್ತು ಆರ್ದ್ರತೆ ${context.humidity}%. ${action}`,
    };
    return replies[language];
  }
  return action;
}

export function LocalAssistant({
  language,
  context,
}: {
  language: AssistantLanguage;
  context: AssistantContext;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(1);
  const text = copy[language];
  const visibleMessages = useMemo(
    () =>
      messages.length
        ? messages
        : [{ id: 0, from: 'assistant' as const, text: text.welcome }],
    [messages, text.welcome],
  );

  function submitMessage(value = input) {
    const question = value.trim();
    if (!question) return;
    const userId = nextId.current++;
    const answerId = nextId.current++;
    setMessages((current) => [
      ...current,
      { id: userId, from: 'user', text: question },
      {
        id: answerId,
        from: 'assistant',
        text: localAnswer(question, context, language),
      },
    ]);
    setInput('');
  }

  function speak(message: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = locale[language];
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  function startVoice() {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const RecognitionApi =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionApi) {
      setVoiceError(text.voiceUnavailable);
      return;
    }
    setVoiceError('');
    const recognition = new RecognitionApi();
    recognition.lang = locale[language];
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setInput(transcript);
      submitMessage(transcript);
    };
    recognition.onerror = () => {
      setVoiceError(text.voiceUnavailable);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section
          className="mb-3 flex h-[min(570px,75vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgb(15_23_42/24%)]"
          aria-label={text.title}
        >
          <header className="flex items-center gap-3 bg-[#10213f] px-4 py-3 text-white">
            <span className="rounded-xl bg-white/10 p-2">
              <Bot className="h-5 w-5" />
            </span>
            <span>
              <b className="block text-sm">{text.title}</b>
              <small className="text-[10px] text-blue-100">{text.subtitle}</small>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-white hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close local assistant"
            >
              <X />
            </Button>
          </header>
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-[10px] leading-relaxed text-amber-900">
            Local decision support only · not an emergency service or medical diagnosis.
          </div>
          <div
            className="flex-1 space-y-3 overflow-y-auto bg-[#f7f6f2] p-4"
            aria-live="polite"
          >
            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${message.from === 'user' ? 'rounded-br-md bg-blue-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}
                >
                  {message.text}
                  {message.from === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => speak(message.text)}
                      className="ml-2 inline-flex align-middle text-blue-700"
                      aria-label="Read response aloud"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {text.quick.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => submitMessage(question)}
                  className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {question}
                </button>
              ))}
            </div>
            {voiceError && (
              <p className="mb-2 text-[10px] text-amber-700">{voiceError}</p>
            )}
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage();
              }}
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={listening ? text.listening : text.placeholder}
                aria-label={text.prompt}
              />
              <Button
                type="button"
                size="icon"
                variant={listening ? 'default' : 'outline'}
                onClick={startVoice}
                aria-label={listening ? text.listening : 'Use voice input'}
              >
                <Mic className={listening ? 'animate-pulse' : ''} />
              </Button>
              <Button type="submit" size="icon" aria-label="Send question">
                <Send />
              </Button>
            </form>
          </div>
        </section>
      )}
      <Button
        size="lg"
        className="ml-auto rounded-full bg-[#10213f] px-4 shadow-[0_12px_34px_rgb(15_23_42/28%)] hover:bg-[#18345f]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close local heat assistant' : text.prompt}
      >
        {open ? <X /> : <Bot />}
        <span>{open ? 'Close' : text.title}</span>
      </Button>
    </div>
  );
}
