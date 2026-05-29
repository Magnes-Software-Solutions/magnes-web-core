const NVD_CONFIG = {
  BASE_URL: '/nvd/cves',
  RESULTS_PER_PAGE: 20
};

const NVD_KEYWORDS = [
  'mysql',
  'ubuntu',
  'node.js',
  'linux kernel',
  'openssl',
  'glibc',
  'firmware'
];

class NVDIntegration {
  constructor() {
    this.cachedCVEs = [];
    this.lastFetch = null;
  }

  async fetchCVEs() {
    try {
      const listaFinal = [];
      const idsJaAdicionados = [];

      for (let i = 0; i < NVD_KEYWORDS.length; i++) {
        const keyword = NVD_KEYWORDS[i];
        const dados = await this.buscarNaNVD(keyword);
        const vulnerabilidades = dados.vulnerabilities || [];

        for (let j = 0; j < vulnerabilidades.length; j++) {
          const item = vulnerabilidades[j];
          const cve = item.cve;

          if (!cve || !cve.id) {
            continue;
          }

          if (idsJaAdicionados.includes(cve.id)) {
            continue;
          }

          const cvss = this.pegarCVSS(cve);
          if (cvss < 7) {
            continue;
          }

          idsJaAdicionados.push(cve.id);
          listaFinal.push({
            id: cve.id,
            cvss: cvss,
            componente: this.pegarComponente(cve),
            servidores: this.pegarServidores(cve),
            status: this.pegarStatus(cve),
            diasAberto: this.pegarDiasAberto(cve.published),
            descricao: this.pegarDescricao(cve)
          });
        }
      }

      listaFinal.sort(function(a, b) {
        return b.cvss - a.cvss;
      });

      const cves = listaFinal.slice(0, 10);
      this.cachedCVEs = cves;
      this.lastFetch = new Date();

      console.log('[NVD] ' + cves.length + ' CVEs encontradas');

      if (cves.length > 0) {
        return cves;
      }

      return this.getFallbackCVEs();
    } catch (erro) {
      console.warn('[NVD] Falha ao buscar CVEs:', erro);

      if (this.cachedCVEs.length > 0) {
        return this.cachedCVEs;
      }

      return this.getFallbackCVEs();
    }
  }

  async buscarNaNVD(keyword) {
    const url = new URL(NVD_CONFIG.BASE_URL, window.location.origin);
    const hoje = new Date();
    const noventaDiasAtras = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);

    url.searchParams.set('resultsPerPage', NVD_CONFIG.RESULTS_PER_PAGE);
    url.searchParams.set('keywordSearch', keyword);
    url.searchParams.set('pubStartDate', noventaDiasAtras.toISOString());

    const resposta = await fetch(url.toString(), { cache: 'no-cache' });

    if (!resposta.ok) {
      console.warn('[NVD] Falha na keyword ' + keyword + ': HTTP ' + resposta.status);
      return { vulnerabilities: [] };
    }

    return resposta.json();
  }

  pegarCVSS(cve) {
    if (cve.metrics && cve.metrics.cvssMetricV31 && cve.metrics.cvssMetricV31.length > 0) {
      return cve.metrics.cvssMetricV31[0].cvssData.baseScore;
    }

    if (cve.metrics && cve.metrics.cvssMetricV30 && cve.metrics.cvssMetricV30.length > 0) {
      return cve.metrics.cvssMetricV30[0].cvssData.baseScore;
    }

    if (cve.metrics && cve.metrics.cvssMetricV2 && cve.metrics.cvssMetricV2.length > 0) {
      return cve.metrics.cvssMetricV2[0].cvssData.baseScore;
    }

    return 0;
  }

  pegarDescricao(cve) {
    if (!cve.descriptions) {
      return 'Descricao nao disponivel';
    }

    for (let i = 0; i < cve.descriptions.length; i++) {
      if (cve.descriptions[i].lang === 'en') {
        return cve.descriptions[i].value;
      }
    }

    return 'Descricao nao disponivel';
  }

  pegarTextoParaBusca(cve) {
    let texto = this.pegarDescricao(cve);

    if (cve.configurations) {
      texto += ' ' + JSON.stringify(cve.configurations);
    }

    return texto.toLowerCase();
  }

  pegarComponente(cve) {
    const texto = this.pegarTextoParaBusca(cve);

    if (texto.includes('mysql')) {
      return 'MySQL';
    }

    if (texto.includes('ubuntu')) {
      return 'Ubuntu';
    }

    if (texto.includes('node.js') || texto.includes('nodejs')) {
      return 'Node.js';
    }

    if (texto.includes('linux kernel') || texto.includes('linux_kernel')) {
      return 'Linux Kernel';
    }

    if (texto.includes('openssl')) {
      return 'OpenSSL';
    }

    if (texto.includes('glibc')) {
      return 'glibc';
    }

    if (texto.includes('firmware')) {
      return 'Firmware';
    }

    return 'Componente desconhecido';
  }

  pegarServidores(cve) {
    const componente = this.pegarComponente(cve);

    if (componente === 'MySQL') {
      return ['SRV-03', 'SRV-04'];
    }

    if (componente === 'Ubuntu') {
      return ['SRV-01', 'SRV-02', 'SRV-05'];
    }

    if (componente === 'Node.js') {
      return ['SRV-02', 'SRV-04'];
    }

    if (componente === 'Linux Kernel') {
      return ['SRV-01', 'SRV-02', 'SRV-05'];
    }

    if (componente === 'OpenSSL') {
      return ['SRV-01', 'SRV-02'];
    }

    if (componente === 'glibc') {
      return ['SRV-02', 'SRV-05'];
    }

    if (componente === 'Firmware') {
      return ['SRV-01', 'SRV-03'];
    }

    return [];
  }

  pegarStatus(cve) {
    if (cve.vulnStatus === 'Analyzed') {
      return 'Sem patch';
    }

    return 'Em teste';
  }

  pegarDiasAberto(dataPublicacao) {
    const data = new Date(dataPublicacao);

    if (isNaN(data.getTime())) {
      return 0;
    }

    const diferenca = Date.now() - data.getTime();
    return Math.floor(diferenca / 86400000);
  }

  getFallbackCVEs() {
    return [
      { id: 'CVE-2024-1086', cvss: 9.8, componente: 'Kernel Linux', servidores: ['SRV-02'], status: 'Sem patch', diasAberto: 47, descricao: 'Use-after-free vulnerability in Linux kernel' },
      { id: 'CVE-2024-0727', cvss: 9.4, componente: 'OpenSSL', servidores: ['SRV-01', 'SRV-02'], status: 'Sem patch', diasAberto: 38, descricao: 'Buffer overflow in OpenSSL' },
      { id: 'CVE-2024-3094', cvss: 7.1, componente: 'Kernel Linux', servidores: ['SRV-05'], status: 'Sem patch', diasAberto: 9, descricao: 'Privilege escalation in Linux kernel' },
      { id: 'CVE-2023-4911', cvss: 7.8, componente: 'glibc', servidores: ['SRV-02'], status: 'Em teste', diasAberto: 22, descricao: 'Buffer overflow in glibc' }
    ];
  }
}
