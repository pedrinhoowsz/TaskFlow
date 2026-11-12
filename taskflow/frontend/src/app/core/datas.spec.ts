import { dataLocalHoje } from './datas';

describe('dataLocalHoje', () => {
  afterEach(() => jasmine.clock().uninstall());

  it('formata como yyyy-MM-dd com zeros à esquerda', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 5, 12, 0)); // 5 de janeiro (mês começa em 0)
    expect(dataLocalHoje()).toBe('2026-01-05');
  });

  it('usa o fuso local, não UTC (23h59 continua sendo o mesmo dia)', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 11, 31, 23, 59));
    expect(dataLocalHoje()).toBe('2026-12-31');
  });
});
