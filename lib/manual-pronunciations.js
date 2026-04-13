import { normalizeOxfordWord } from './oxford.js'

function buildLocalAudioUrl(word, accent) {
  return `/audio/manual/${accent}/${word}.mp3`
}

function makeManualEntry(word, phoneticUk, phoneticUs, ttsText = word) {
  return {
    word,
    phoneticUk,
    phoneticUs,
    audioUk: buildLocalAudioUrl(word, 'uk'),
    audioUs: buildLocalAudioUrl(word, 'us'),
    source: 'manual',
    entryUrl: '',
    ttsText,
  }
}

export const MANUAL_PRONUNCIATIONS = {
  aminoacid: makeManualEntry('aminoacid', 'əˌmiːnəʊ ˈæsɪd', 'əˌmiːnoʊ ˈæsɪd', 'amino acid'),
  apprize: makeManualEntry('apprize', 'əˈpraɪz', 'əˈpraɪz'),
  'bamboo-shoot': makeManualEntry('bamboo-shoot', 'bæmˈbuː ʃuːt', 'bæmˈbuː ʃuːt', 'bamboo shoot'),
  'bread-earner': makeManualEntry('bread-earner', 'ˈbred ˌɜːnə', 'ˈbred ˌɝːnər', 'bread earner'),
  cif: makeManualEntry('cif', 'ˌsiː aɪ ˈef', 'ˌsiː aɪ ˈef', 'C I F'),
  countersignature: makeManualEntry('countersignature', 'ˌkaʊntəˈsɪɡnətʃə', 'ˌkaʊntərˈsɪɡnətʃɚ'),
  discomfortable: makeManualEntry('discomfortable', 'dɪsˈkʌmftəbəl', 'dɪsˈkʌmftɚbəl'),
  disgustful: makeManualEntry('disgustful', 'dɪsˈɡʌstfəl', 'dɪsˈɡʌstfəl'),
  hairdress: makeManualEntry('hairdress', 'ˈheədres', 'ˈherdres'),
  minicomputer: makeManualEntry('minicomputer', 'ˈmɪni kəmˌpjuːtə', 'ˈmɪni kəmˌpjuːtɚ', 'mini computer'),
  papercutting: makeManualEntry('papercutting', 'ˈpeɪpə ˌkʌtɪŋ', 'ˈpeɪpɚ ˌkʌtɪŋ', 'paper cutting'),
  'past-due': makeManualEntry('past-due', 'ˌpɑːst ˈdjuː', 'ˌpæst ˈduː', 'past due'),
  pharmaceutist: makeManualEntry('pharmaceutist', 'ˌfɑːməˈsjuːtɪst', 'ˌfɑːrməˈsuːtɪst'),
  prefabricate: makeManualEntry('prefabricate', 'ˌpriːˈfæbrɪkeɪt', 'ˌpriːˈfæbrɪkeɪt'),
  propellent: makeManualEntry('propellent', 'prəˈpelənt', 'prəˈpelənt'),
  subsequence: makeManualEntry('subsequence', 'ˈsʌbsɪkwəns', 'ˈsʌbsɪkwəns'),
  telefax: makeManualEntry('telefax', 'ˈtelifæks', 'ˈtelifæks'),
  transshipment: makeManualEntry('transshipment', 'trænsˈʃɪpmənt', 'trænsˈʃɪpmənt'),
  dissatisfy: makeManualEntry('dissatisfy', 'ˌdɪsˈsætɪsfaɪ', 'ˌdɪsˈsætɪsfaɪ'),
  ultimo: makeManualEntry('ultimo', 'ˈʌltɪməʊ', 'ˈʌltɪmoʊ'),
  transship: makeManualEntry('transship', 'trænzˈʃɪp', 'trænzˈʃɪp'),
  arrear: makeManualEntry('arrear', 'əˈrɪə', 'əˈrɪr'),
  layday: makeManualEntry('layday', 'ˈleɪdeɪ', 'ˈleɪdeɪ'),
  conceptive: makeManualEntry('conceptive', 'kənˈseptɪv', 'kənˈseptɪv'),
  reexport: makeManualEntry('reexport', 'ˌriːɪkˈspɔːt', 'ˌriːɪkˈspɔːrt', 're export'),
  impost: makeManualEntry('impost', 'ˈɪmpɒst', 'ˈɪmpɑːst'),
  guesthouse: makeManualEntry('guesthouse', 'ˈɡesthaʊs', 'ˈɡesthaʊs', 'guest house'),
  labor: makeManualEntry('labor', 'ˈleɪbə', 'ˈleɪbər'),
  'ball-pointpen': makeManualEntry('ball-pointpen', 'ˈbɔːl pɔɪnt pen', 'ˈbɔːl pɔɪnt pen', 'ball point pen'),
  multifunction: makeManualEntry('multifunction', 'ˌmʌltiˈfʌŋkʃən', 'ˌmʌltiˈfʌŋkʃən', 'multi function'),
  proforma: makeManualEntry('proforma', 'prəʊˈfɔːmə', 'proʊˈfɔːrmə', 'pro forma'),
  referent: makeManualEntry('referent', 'ˈrefərənt', 'ˈrefərənt'),
  inapt: makeManualEntry('inapt', 'ɪˈnæpt', 'ɪˈnæpt'),
  'b/l': makeManualEntry('b/l', 'ˌbiː ˈel', 'ˌbiː ˈel', 'B L'),
  'back-call': makeManualEntry('back-call', 'ˈbæk kɔːl', 'ˈbæk kɔːl', 'back call'),
  'short-weight': makeManualEntry('short-weight', 'ˌʃɔːt ˈweɪt', 'ˌʃɔːrt ˈweɪt', 'short weight'),
  delcredere: makeManualEntry('delcredere', 'ˌdel ˈkreɪdəreɪ', 'ˌdel ˈkreɪdəreɪ'),
  ferryboat: makeManualEntry('ferryboat', 'ˈferibəʊt', 'ˈferiboʊt', 'ferry boat'),
  langkap: makeManualEntry('langkap', 'ˈlæŋkæp', 'ˈlæŋkæp', 'Langkap'),
  upcreep: makeManualEntry('upcreep', 'ˈʌpkriːp', 'ˈʌpkriːp', 'up creep'),
  america: makeManualEntry('america', 'əˈmerɪkə', 'əˈmerɪkə', 'America'),
  unaccommodating: makeManualEntry('unaccommodating', 'ˌʌnəˈkɒmədeɪtɪŋ', 'ˌʌnəˈkɑːmədeɪtɪŋ'),
  protract: makeManualEntry('protract', 'prəˈtrækt', 'prəˈtrækt'),
  unemloyment: makeManualEntry('unemloyment', 'ˌʌnɪmˈplɔɪmənt', 'ˌʌnɪmˈplɔɪmənt', 'unemployment'),
  bacterium: makeManualEntry('bacterium', 'bækˈtɪəriəm', 'bækˈtɪriəm'),
  auspice: makeManualEntry('auspice', 'ˈɔːspɪs', 'ˈɔːspɪs'),
  terminable: makeManualEntry('terminable', 'ˈtɜːmɪnəbəl', 'ˈtɝːmɪnəbəl'),
  salution: makeManualEntry('salution', 'ˌsæljuˈteɪʃən', 'ˌsæljuˈteɪʃən', 'salutation'),
  destine: makeManualEntry('destine', 'ˈdestɪn', 'ˈdestɪn'),
  expedience: makeManualEntry('expedience', 'ɪkˈspiːdiəns', 'ɪkˈspiːdiəns'),
  incoterms: makeManualEntry('incoterms', 'ˈɪŋkəʊtɜːmz', 'ˈɪŋkoʊtɝːmz', 'Incoterms'),
  alga: makeManualEntry('alga', 'ˈælɡə', 'ˈælɡə'),
  'no.': makeManualEntry('no.', 'ˈnʌmbə', 'ˈnʌmbər', 'number'),
  obligate: makeManualEntry('obligate', 'ˈɒblɪɡeɪt', 'ˈɑːblɪɡeɪt'),
  papercut: makeManualEntry('papercut', 'ˈpeɪpəkʌt', 'ˈpeɪpərkʌt', 'paper cut'),
  overjoy: makeManualEntry('overjoy', 'ˌəʊvəˈdʒɔɪ', 'ˌoʊvərˈdʒɔɪ'),
  outturn: makeManualEntry('outturn', 'ˈaʊttɜːn', 'ˈaʊttɝːn'),
  hysteric: makeManualEntry('hysteric', 'hɪˈsterɪk', 'hɪˈsterɪk'),
  enroute: makeManualEntry('enroute', 'ˌɒn ˈruːt', 'ˌɑːn ˈruːt', 'en route'),
  antonymous: makeManualEntry('antonymous', 'ænˈtɒnɪməs', 'ænˈtɑːnɪməs'),
  distributorship: makeManualEntry('distributorship', 'dɪˈstrɪbjətəʃɪp', 'dɪˈstrɪbjətərʃɪp'),
  'counter-offer': makeManualEntry('counter-offer', 'ˌkaʊntər ˈɒfə', 'ˌkaʊntər ˈɔːfər', 'counter offer'),
  salability: makeManualEntry('salability', 'ˌseɪləˈbɪləti', 'ˌseɪləˈbɪləti'),
  'off-grade': makeManualEntry('off-grade', 'ˌɒf ˈɡreɪd', 'ˌɔːf ˈɡreɪd', 'off grade'),
  'note-taking': makeManualEntry('note-taking', 'ˈnəʊt teɪkɪŋ', 'ˈnoʊt teɪkɪŋ', 'note taking'),
  outland: makeManualEntry('outland', 'ˈaʊtlænd', 'ˈaʊtlænd'),
  'o.k.': makeManualEntry('o.k.', 'ˌəʊˈkeɪ', 'ˌoʊˈkeɪ', 'okay'),
  tetrad: makeManualEntry('tetrad', 'ˈtetræd', 'ˈtetræd'),
  demurrage: makeManualEntry('demurrage', 'dɪˈmʌrɪdʒ', 'dɪˈmʌrɪdʒ'),
  photostatic: makeManualEntry('photostatic', 'ˌfəʊtəˈstætɪk', 'ˌfoʊtəˈstætɪk'),
  characteristical: makeManualEntry('characteristical', 'ˌkærəktəˈrɪstɪkəl', 'ˌkærəktərˈɪstɪkəl'),
  'c/o': makeManualEntry('c/o', 'ˌkeər ˈɒv', 'ˌker ˈʌv', 'care of'),
  'l/c': makeManualEntry('l/c', 'ˌletər əv ˈkredɪt', 'ˌletər əv ˈkredɪt', 'letter of credit'),
  regionalize: makeManualEntry('regionalize', 'ˈriːdʒənəlaɪz', 'ˈriːdʒənəlaɪz'),
  assassinator: makeManualEntry('assassinator', 'əˈsæsɪneɪtə', 'əˈsæsɪneɪtər'),
}

export function getManualPronunciation(rawWord) {
  const word = normalizeOxfordWord(rawWord)
  const detail = MANUAL_PRONUNCIATIONS[word]

  if (!detail) return null
  const { ttsText: _ttsText, ...publicDetail } = detail
  return publicDetail
}
