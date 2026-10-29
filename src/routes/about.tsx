import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "~/components/icon";
import { Byline, Fact, PageHeader, Section } from "~/components/list";
import { cn } from "~/lib/utils";
import { breadcrumbs, jsonLd, PERSON, seo } from "~/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    ...seo({
      title: "About",
      description:
        "About Nischal Dahal (@broisnees): full-stack engineer at AITC International in Kathmandu, Nepal. The Mercury chatbot, backend, DevOps and the products I work on.",
      path: "/about",
      type: "profile",
    }),
    scripts: [
      jsonLd(
        { "@type": "ProfilePage", mainEntity: PERSON },
        breadcrumbs([{ name: "About", path: "/about" }]),
      ),
    ],
  }),
  component: About,
});

type Product = { name: string; href: string; icon: string };

const P = {
  mercury: {
    name: "Mercury 360",
    href: "https://mercury360.io",
    icon: "/work-icons/mercury.png",
  },
  recruit: {
    name: "Mercury Recruit",
    href: "https://mercury360.io/recruit",
    icon: "/work-icons/mercury.png",
  },
  cryptica: {
    name: "CrypticaPay",
    href: "https://crypticapay.com",
    icon: "/work-icons/cryptica.png",
  },
  homes: {
    name: "AITC Homes",
    href: "https://aitchomes.com",
    icon: "/work-icons/aitchomes.png",
  },
  annapurna: {
    name: "Annapurna Art",
    href: "https://annapurnaart.com",
    icon: "/work-icons/annapurna.png",
  },
  eureka: {
    name: "Eureka Traders",
    href: "https://eurekatraders.org",
    icon: "/work-icons/eureka.png",
  },
} satisfies Record<string, Product>;

/** What I do at AITC, newest first. Only "Now" and the start carry a time. */
const TIMELINE: {
  when?: string;
  title: string;
  body: string;
  products?: Product[];
}[] = [
  {
    when: "Now",
    title: "Mercury chatbot and widgets",
    body: "Building the Mercury chatbot and the embeddable chat widgets that put it on other sites.",
    products: [P.mercury],
  },
  {
    title: "Backend and authentication",
    body: "Authentication and multi-tenant permissions with CASL and ABAC, services that talk over Kafka, third-party integrations, and Sentry for monitoring.",
  },
  {
    title: "DevOps and infrastructure",
    body: "Kubernetes on GCP provisioned with Terraform, secrets and container registry, and CI/CD that ships web deploys and Play Store and App Store releases.",
  },
  {
    title: "Mobile",
    body: "Leading the Flutter apps for visitor management: a resident app and a guard app, with real-time notifications.",
    products: [P.homes],
  },
  {
    title: "Products",
    body: "Web products I’ve built and maintain with the team.",
    products: [P.recruit, P.cryptica, P.annapurna, P.eureka],
  },
  {
    when: "2022",
    title: "Joined AITC International",
    body: "As a full-stack engineer. Now I lead teams across web, mobile and infra.",
  },
];

function About() {
  return (
    <>
      <PageHeader title="About" description="Full-stack engineer in Kathmandu.">
        <Byline>
          <Fact>Kathmandu, Nepal</Fact>
        </Byline>
      </PageHeader>
      <div className="space-y-4 text-[1.0625rem]/[1.6] tracking-[-0.01em] text-pretty">
        <p>
          I’m Nischal. I write software in Kathmandu and go by{" "}
          <strong className="font-[575] text-fg">@broisnees</strong> online.
        </p>
        <p>
          Most of my work sits{" "}
          <strong className="font-[575] text-fg">
            between the API and the screen
          </strong>
          : serverless backends, type-safe frontends, Flutter apps, and the
          infra that ships them.
        </p>
        <p>
          Part engineer, part romantic, quietly sophisticated, and an
          unapologetic nerd who ships.
        </p>
      </div>

      <Section title="Work">
        <p className="-mt-2 mb-8 text-muted">
          Full-stack engineer at{" "}
          <span className="font-medium text-fg">AITC International</span>, 2022
          to now.
        </p>
        <Timeline />
      </Section>

      <Section title="Contact">
        <p className="text-[1.0625rem]/[1.6] tracking-[-0.01em] text-pretty">
          Email{" "}
          <a href="mailto:broisnees@gmail.com" className="link">
            broisnees@gmail.com
          </a>{" "}
          or message{" "}
          <a href="https://x.com/broisnees" className="link">
            @broisnees
          </a>{" "}
          on X. My resume is{" "}
          <a href="/resume.pdf" className="link">
            here
          </a>
          .
        </p>
      </Section>
    </>
  );
}

function Timeline() {
  return (
    <ol>
      {TIMELINE.map((entry, i) => {
        const now = entry.when === "Now";
        const last = i === TIMELINE.length - 1;
        return (
          <li key={entry.title} className="relative pb-9 pl-9 last:pb-0">
            {/* The rail between dots. */}
            {!last && (
              <span
                aria-hidden
                className="absolute top-5 bottom-0 left-[7px] w-px bg-line"
              />
            )}
            <span
              aria-hidden
              className={cn(
                "absolute top-1.5 left-0 size-[15px] rounded-full",
                now
                  ? "bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_22%,transparent)]"
                  : "bg-bg shadow-[inset_0_0_0_2px_var(--line)]",
              )}
            />
            <p className="flex items-baseline gap-2.5">
              <span className="font-[575] text-fg">{entry.title}</span>
              {entry.when && (
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    now ? "text-accent" : "text-muted",
                  )}
                >
                  {entry.when}
                </span>
              )}
            </p>
            <p className="mt-1 text-pretty text-muted">{entry.body}</p>
            {entry.products && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {entry.products.map((product) => (
                  <li key={product.name}>
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex h-8 items-center gap-2 rounded-full bg-surface pr-3 pl-1 text-sm text-fg shadow-hairline-inset transition-[background-color] duration-150 ease-out hover:bg-surface-hover"
                    >
                      <span className="grid size-6 place-items-center overflow-hidden rounded-full bg-white">
                        <img
                          src={product.icon}
                          alt=""
                          width={24}
                          height={24}
                          className="size-5"
                        />
                      </span>
                      {product.name}
                      <Icon
                        icon={ArrowUpRight01Icon}
                        size={13}
                        className="text-muted transition-[color] duration-150 ease-out group-hover:text-accent"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
