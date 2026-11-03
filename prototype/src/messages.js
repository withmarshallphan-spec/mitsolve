// Patient messages. Design rules (privacy + low literacy):
//  - Never name the condition or the medicine: an SMS read by someone else
//    must not disclose HIV, TB or epilepsy status.
//  - No patient name. Only clinic, date and a hotline.
//  - Short enough for one or two SMS segments. Accents are deliberately
//    dropped (saude, ate) so messages stay in the GSM-7 alphabet: one accent
//    outside it switches the whole SMS to UCS-2 and can triple the cost.
// Non-English templates are drafts and must be reviewed by native speakers and
// local health promoters before any real use.

export const LANGUAGES = {
  en: 'English',
  pt: 'Português',
  sw: 'Kiswahili',
  fr: 'Français',
};

const T = {
  early_refill: {
    en: 'Health alert: bad weather may close roads from {onset}. Please collect your medicine early at {clinic} by {deadline}. Questions: {hotline}',
    pt: 'Alerta de saude: o mau tempo pode cortar estradas a partir de {onset}. Levante o seu medicamento mais cedo em {clinic} ate {deadline}. Duvidas: {hotline}',
    sw: 'Tahadhari ya afya: hali mbaya ya hewa inaweza kufunga barabara kuanzia {onset}. Tafadhali chukua dawa zako mapema {clinic} kabla ya {deadline}. Maswali: {hotline}',
    fr: 'Alerte sante : les routes pourraient etre coupees a partir du {onset}. Retirez vos medicaments en avance a {clinic} avant le {deadline}. Questions : {hotline}',
  },
  chw_delivery: {
    en: 'Health alert: roads may close from {onset}. A health worker will bring your medicine before {deadline}. Please stay reachable. Questions: {hotline}',
    pt: 'Alerta de saude: estradas podem fechar a partir de {onset}. Um agente de saude vai levar o seu medicamento antes de {deadline}. Duvidas: {hotline}',
    sw: 'Tahadhari ya afya: barabara zinaweza kufungwa kuanzia {onset}. Mhudumu wa afya ataleta dawa zako kabla ya {deadline}. Maswali: {hotline}',
    fr: 'Alerte sante : routes coupees possibles a partir du {onset}. Un agent de sante vous apportera vos medicaments avant le {deadline}. Questions : {hotline}',
  },
  reroute: {
    en: 'Notice: your clinic will close on {onset}. Collect your medicine at {clinic} by {deadline}. Your new clinic is {newclinic}; your records will be sent there. Questions: {hotline}',
    pt: 'Aviso: a sua unidade sanitaria fecha a {onset}. Levante o medicamento em {clinic} ate {deadline}. A sua nova unidade e {newclinic}; o processo sera enviado. Duvidas: {hotline}',
    sw: 'Taarifa: kliniki yako itafungwa {onset}. Chukua dawa zako {clinic} kabla ya {deadline}. Kliniki yako mpya ni {newclinic}; kumbukumbu zako zitatumwa huko. Maswali: {hotline}',
    fr: 'Avis : votre centre ferme le {onset}. Retirez vos medicaments a {clinic} avant le {deadline}. Votre nouveau centre : {newclinic} ; votre dossier y sera transfere. Questions : {hotline}',
  },
  outreach: {
    en: 'Health alert: a health worker will contact you about your medicine in the next days. If you run out, call {hotline}.',
    pt: 'Alerta de saude: um agente de saude vai contacta-lo sobre o seu medicamento nos proximos dias. Se acabar, ligue {hotline}.',
    sw: 'Tahadhari ya afya: mhudumu wa afya atawasiliana nawe kuhusu dawa zako siku chache zijazo. Zikiisha, piga {hotline}.',
    fr: 'Alerte sante : un agent de sante vous contactera au sujet de vos medicaments. En cas de rupture, appelez le {hotline}.',
  },
  heat_early_refill: {
    en: 'Health alert: extreme heat expected from {onset}. Collect your medicine early at {clinic} by {deadline} to avoid travelling in the heat. Questions: {hotline}',
    pt: 'Alerta de saude: calor extremo a partir de {onset}. Levante o seu medicamento mais cedo em {clinic} ate {deadline} para evitar viajar no calor. Duvidas: {hotline}',
    sw: 'Tahadhari ya afya: joto kali linatarajiwa kuanzia {onset}. Chukua dawa zako mapema {clinic} kabla ya {deadline} ili kuepuka kusafiri kwenye joto. Maswali: {hotline}',
    fr: 'Alerte sante : chaleur extreme a partir du {onset}. Retirez vos medicaments en avance a {clinic} avant le {deadline}. Questions : {hotline}',
  },
};

function shortDate(iso, lang) {
  const d = new Date(iso + 'T00:00:00Z');
  const locale = { en: 'en-GB', pt: 'pt-PT', sw: 'sw-KE', fr: 'fr-FR' }[lang] || 'en-GB';
  try {
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}

export function templateKey(action, eventType) {
  if (action === 'early_refill' && eventType === 'heat') return 'heat_early_refill';
  return action;
}

export function renderMessage({ action, eventType, lang, onset, deadline, clinic, newClinic, hotline }) {
  const key = templateKey(action, eventType);
  const set = T[key];
  if (!set) return '';
  const tpl = set[lang] || set.en;
  return tpl
    .replaceAll('{onset}', shortDate(onset, lang))
    .replaceAll('{deadline}', shortDate(deadline, lang))
    .replaceAll('{clinic}', clinic || '')
    .replaceAll('{newclinic}', newClinic || '')
    .replaceAll('{hotline}', hotline || '');
}

// GSM-7 single segment = 160 chars; multi-part = 153 per segment.
export function smsSegments(text) {
  // Non-GSM characters force UCS-2 (70 / 67 chars per segment).
  const gsm = /^[\n\r -~£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ¤¡ÄÖÑÜ§¿äöñüà]*$/.test(text);
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  if (text.length <= single) return 1;
  return Math.ceil(text.length / multi);
}
