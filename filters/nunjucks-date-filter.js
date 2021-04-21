var dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
dayjs.extend(advancedFormat);

/* defaultFormat could be any other valid dayjs format,
 * or null, in which case we’d get dayjs().format() */
const defaultFormat = 'DD MMM YYYY';

function dayjsFilter(date, format = defaultFormat) {
  return dayjs(date).format(format);
}

module.exports = dayjsFilter;