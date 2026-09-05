import { join } from "path";

const CLI_PATH = join(import.meta.dir, "../src/cli.ts");

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCLI(args: string[]): Promise<CLIResult> {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

export function parseJSON<T = unknown>(result: CLIResult): T {
  if (result.exitCode !== 0) {
    throw new Error(
      `CLI exited with code ${result.exitCode}. stderr: ${result.stderr}`
    );
  }
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON. stdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }
}

export const SAMPLE_SEARCH_HTML = `
<!DOCTYPE html>
<html>
<body>
<div class="col-md-12 result-item mb-3 bg-white" style="text-align: left;">
    <div class="col-md-12 p-0 js-area-bind area-bind" data-url="/co/ofertas-trabajo/desarrollador-python-senior-1886762593" data-ga4-offerdata="{&quot;section&quot;:&quot;SEARCH&quot;,&quot;id&quot;:1886762593,&quot;title&quot;:&quot;Desarrollador Python Senior&quot;,&quot;company&quot;:&quot;Tech Solutions SAS&quot;,&quot;location&quot;:&quot;Bogot&#225;&quot;,&quot;salary&quot;:&quot;$8 a $10 millones&quot;,&quot;position&quot;:1}">
        <h2 class="h4 item-title">
            <a class="js-offer-title" href="/co/ofertas-trabajo/desarrollador-python-senior-1886762593">
                Desarrollador Python Senior
            </a>
        </h2>
        <span class="js-offer-company">Tech Solutions SAS</span>
        <span class="js-offer-city">Bogot&#225;</span>
        <span class="js-offer-date">Hoy</span>
        <div class="text-blue-petrol-dark">$8 a $10 millones</div>
    </div>
</div>
<div class="col-md-12 result-item mb-3 bg-white" style="text-align: left;">
    <div class="col-md-12 p-0 js-area-bind area-bind" data-url="/co/ofertas-trabajo/analista-de-datos-bi-1886762594" data-ga4-offerdata="{&quot;section&quot;:&quot;SEARCH&quot;,&quot;id&quot;:1886762594,&quot;title&quot;:&quot;Analista de Datos BI&quot;,&quot;company&quot;:&quot;Financiera Andina&quot;,&quot;location&quot;:&quot;Medell&#237;n&quot;,&quot;salary&quot;:&quot;$4,5 a $6 millones&quot;,&quot;position&quot;:2}">
        <h2 class="h4 item-title">
            <a class="js-offer-title" href="/co/ofertas-trabajo/analista-de-datos-bi-1886762594">
                Analista de Datos BI
            </a>
        </h2>
        <span class="js-offer-company">Financiera Andina</span>
        <span class="js-offer-city">Medell&#237;n</span>
        <span class="js-offer-date">Hace 3 d&#237;as</span>
    </div>
</div>
</body>
</html>
`;

export const SAMPLE_DETAIL_HTML = `
<!DOCTYPE html>
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": "Desarrollador Python Senior",
        "description": "Buscamos un Ingeniero de Software Python Senior con experiencia en Django, FastAPI y AWS.",
        "datePosted": "2026-09-05",
        "validThrough": "2026-10-05",
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
            "@type": "Organization",
            "name": "Tech Solutions SAS"
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bogotá",
                "addressRegion": "Cundinamarca",
                "addressCountry": "CO"
            }
        },
        "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "COP",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": 8000000,
                "maxValue": 10000000,
                "unitText": "MONTH"
            }
        },
        "directApply": true
    }
    </script>
</head>
<body>
    <h1>Desarrollador Python Senior</h1>
    <div class="description-block">Buscamos un Ingeniero de Software Python Senior...</div>
</body>
</html>
`;
