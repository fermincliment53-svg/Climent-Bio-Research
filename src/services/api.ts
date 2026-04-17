/**
 * Service for interacting with academic databases
 */

export interface AcademicWork {
  id: string;
  title: string;
  author?: string;
  year?: number;
  source: string;
  type: 'paper' | 'book';
  citations?: number;
  doi?: string;
  pdfUrl?: string;
  pageUrl: string;
}

export const API_SOURCES = {
  OPENALEX: 'OpenAlex (Global OA)',
  NCBI: 'NCBI Bookshelf (Medicina)',
  EUROPE_PMC: 'Europe PMC (Biomedicina)',
  DOAB: 'DOAB (Libros OA)',
  BIORXIV: 'bioRxiv / medRxiv (Preprints)',
  GOOGLE_SCHOLAR: 'Google Scholar (Bridge)',
  DORKING: 'Sitio Web Específico (Dorking)'
};

export async function searchWorks(query: string, source: string, filters: {
  limit: number;
  minYear: number;
  minCites: number;
  onlyOA: boolean;
}): Promise<AcademicWork[]> {
  switch (source) {
    case API_SOURCES.OPENALEX:
      return fetchOpenAlex(query, filters);
    case API_SOURCES.EUROPE_PMC:
      return fetchEuropePMC(query, filters);
    case API_SOURCES.NCBI:
      return fetchNCBI(query, filters);
    case API_SOURCES.BIORXIV:
      return fetchBioRxiv(query, filters);
    case API_SOURCES.DOAB:
      return fetchDOAB(query, filters);
    default:
      return [];
  }
}

async function fetchOpenAlex(query: string, filters: any): Promise<AcademicWork[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query);
  
  let filterStr = `publication_year:>${filters.minYear - 1},cited_by_count:>${filters.minCites - 1}`;
  if (filters.onlyOA) filterStr += ',is_oa:true';
  
  url.searchParams.set('filter', filterStr);
  url.searchParams.set('per_page', filters.limit.toString());
  url.searchParams.set('sort', 'cited_by_count:desc');

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return (data.results || []).map((res: any) => ({
      id: res.id,
      title: res.display_name || 'Sin título',
      author: res.authorships?.[0]?.author?.display_name,
      year: res.publication_year,
      source: 'OpenAlex',
      type: res.type === 'book' ? 'book' : 'paper',
      citations: res.cited_by_count,
      doi: res.doi,
      pdfUrl: res.open_access?.oa_url,
      pageUrl: res.doi || res.id
    }));
  } catch (err) {
    console.error('OpenAlex Error:', err);
    return [];
  }
}

async function fetchEuropePMC(query: string, filters: any): Promise<AcademicWork[]> {
  const q = `${query} AND (PUB_YEAR:>${filters.minYear - 1})${filters.onlyOA ? ' AND (HAS_PDF:Y)' : ''}`;
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&pageSize=${filters.limit}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return (data.resultList?.result || []).map((res: any) => ({
      id: res.id,
      title: res.title || 'Sin título',
      author: res.authorString?.split(',')[0],
      year: parseInt(res.pubYear),
      source: 'Europe PMC',
      type: 'paper',
      citations: res.citedByCount || 0,
      doi: res.doi,
      pdfUrl: res.fullTextUrlList?.fullTextUrl?.find((l: any) => l.documentStyle === 'pdf')?.url,
      pageUrl: `https://europepmc.org/article/MED/${res.id}`
    }));
  } catch (err) {
    console.error('Europe PMC Error:', err);
    return [];
  }
}

async function fetchNCBI(query: string, filters: any): Promise<AcademicWork[]> {
  // Search for IDs
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=books&term=${encodeURIComponent(query)}&retmode=json&retmax=${filters.limit}`;
  
  try {
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    return ids.map((id: string) => ({
      id,
      title: `NCBI Book ID: ${id}`,
      source: 'NCBI Bookshelf',
      type: 'book',
      pageUrl: `https://www.ncbi.nlm.nih.gov/books/NBK${id}/`
    }));
  } catch (err) {
    console.error('NCBI Error:', err);
    return [];
  }
}

async function fetchBioRxiv(query: string, filters: any): Promise<AcademicWork[]> {
  // Using Europe PMC to filter for preprints as it is more reliable for keyword search than bioRxiv direct API
  const q = `${query} AND (PUBLISHER:"bioRxiv" OR PUBLISHER:"medRxiv")`;
  return fetchEuropePMC(q, filters);
}

async function fetchDOAB(query: string, filters: any): Promise<AcademicWork[]> {
  const url = `https://directory.doabooks.org/rest/search?query=${encodeURIComponent(query)}&size=${filters.limit}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return (Array.isArray(data) ? data : []).map((res: any) => ({
      id: res.handle,
      title: res.name || 'Sin título',
      source: 'DOAB',
      type: 'book',
      pageUrl: `https://directory.doabooks.org/handle/${res.handle}`
    }));
  } catch (err) {
    console.error('DOAB Error:', err);
    return [];
  }
}

export function getDorkUrl(query: string, site: string): string {
  const dork = `site:${site} filetype:pdf "${query}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(dork)}`;
}

export function getScholarUrl(query: string, minYear: number): string {
  return `https://scholar.google.com/scholar?as_ylo=${minYear}&q=${encodeURIComponent(query)}`;
}
