import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import 'dayjs/locale/fr.js';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

export default dayjs;
