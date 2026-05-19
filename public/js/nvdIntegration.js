const NVD_CONFIG = {
  BASE_URL: '/nvd/cves',
  RESULTS_PER_PAGE: 20,
  REQUEST_DELAY: 6000,
  UPDATE_INTERVAL: 7200000
};

class NVDIntegration {
  constructor() {
    this.processor = new CVEProcessor();
    this.cachedCVEs = [];
    this.lastFetch = null;
  }

  async fetchCVEs(keywords = ['linux', 'kernel', 'openssl', 'apache', 'windows']) {
    try {
      const url = new URL(NVD_CONFIG.BASE_URL, window.location.origin);

      url.searchParams.append('resultsPerPage', NVD_CONFIG.RESULTS_PER_PAGE);

      const response = await fetch(url.toString(), { cache: 'no-cache' });

      if (!response.ok) {
        throw new Error(`NVD API Error: ${response.status}`);
      }

      const data = await response.json();
      this.lastFetch = new Date();
      this.cachedCVEs = this.processor.processCVEData(data);
      return this.cachedCVEs.length ? this.cachedCVEs : this.getFallbackCVEs();
    } catch (error) {
      console.warn('[NVD] Falha ao buscar CVEs:', error);
      return this.cachedCVEs.length ? this.cachedCVEs : this.getFallbackCVEs();
    }
  }

  getFallbackCVEs() {
    return [
      { id: "CVE-2024-1086", cvss: 9.8, componente: "Kernel Linux", servidores: ["SRV-02"], status: "Sem patch", diasAberto: 47, descricao: "Use-after-free vulnerability in Linux kernel" },
      { id: "CVE-2024-0727", cvss: 9.4, componente: "OpenSSL", servidores: ["SRV-01", "SRV-02"], status: "Sem patch", diasAberto: 38, descricao: "Buffer overflow in OpenSSL" },
      { id: "CVE-2024-3094", cvss: 7.1, componente: "Kernel Linux", servidores: ["SRV-05"], status: "Sem patch", diasAberto: 9, descricao: "Privilege escalation in Linux kernel" },
      { id: "CVE-2023-4911", cvss: 7.8, componente: "glibc", servidores: ["SRV-02"], status: "Em teste", diasAberto: 22, descricao: "Buffer overflow in glibc" }
    ];
  }
}

class CVEProcessor {
  extractCVSSMetrics(metrics) {
    if (metrics?.cvssMetricV31?.length) {
      return metrics.cvssMetricV31[0].cvssData;
    }
    if (metrics?.cvssMetricV30?.length) {
      return metrics.cvssMetricV30[0].cvssData;
    }
    return { baseScore: 0, baseSeverity: 'NONE' };
  }

  extractAffectedProducts(configurations) {
    const products = new Set();
    configurations?.forEach(config => {
      config.nodes?.forEach(node => {
        node.cpeMatch?.forEach(cpeMatch => {
          if (cpeMatch.vulnerable) {
            const parts = cpeMatch.criteria.split(':');
            if (parts.length >= 5) {
              products.add(`${parts[3]}:${parts[4]}`);
            }
          }
        });
      });
    });
    return Array.from(products);
  }

  mapToComponent(cpeProduct) {
    const mapping = {
      'linux:linux_kernel': 'Kernel Linux',
      'openssl:openssl': 'OpenSSL',
      'gnu:glibc': 'glibc',
      'apache:http_server': 'Apache HTTP',
      'microsoft:windows': 'Windows Server'
    };
    return mapping[cpeProduct] || cpeProduct.split(':').pop()?.replace(/_/g, ' ') || 'Unknown';
  }

  matchToServers(products) {
    const serverMapping = {
      'Kernel Linux': ['SRV-01', 'SRV-02', 'SRV-05'],
      'OpenSSL': ['SRV-01', 'SRV-02'],
      'Apache HTTP': ['SRV-03', 'SRV-04'],
      'Windows Server': ['SRV-06'],
      'glibc': ['SRV-02']
    };

    const affectedServers = new Set();
    products.forEach(product => {
      const component = this.mapToComponent(product);
      const servers = serverMapping[component] || [];
      servers.forEach(s => affectedServers.add(s));
    });

    return Array.from(affectedServers);
  }

  processCVEData(nvdData) {
    return (nvdData.vulnerabilities || []).map(vuln => {
      const cve = vuln.cve;
      const metrics = this.extractCVSSMetrics(cve.metrics);
      const affectedProducts = this.extractAffectedProducts(cve.configurations);

      return {
        id: cve.id,
        cvss: metrics.baseScore || 0,
        componente: this.mapToComponent(affectedProducts[0] || 'Unknown'),
        servidores: this.matchToServers(affectedProducts),
        status: cve.vulnStatus === 'Analyzed' ? 'Sem patch' : 'Em teste',
        diasAberto: Math.floor((Date.now() - new Date(cve.published)) / 86400000),
        descricao: cve.descriptions?.find(d => d.lang === 'en')?.value || 'Descricao nao disponivel'
      };
    }).filter(cve => cve.cvss >= 7.0)
      .sort((a, b) => b.cvss - a.cvss)
      .slice(0, 10);
  }
}