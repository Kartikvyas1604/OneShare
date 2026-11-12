import { Marquee } from "@/app/components/Marquee";

/**
 * The closer — hollow double wordmark, obligor pattern: transparent fill +
 * 2px stroke, serif display, masked edges, own bordered section above the
 * footer.
 */
export function WordmarkMarquee() {
  return (
    <section
      aria-hidden
      className="overflow-hidden border-t border-border py-10 md:py-16 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      <Marquee duration={60}>
        <span className="display block whitespace-nowrap text-[110px] leading-[1.25] tracking-[-0.02em] md:text-[180px]">
          <span className="wordmark-stroke">
            Floorline&nbsp;&nbsp;&nbsp;&nbsp;Floorline&nbsp;&nbsp;&nbsp;&nbsp;Floorline&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </span>
      </Marquee>
    </section>
  );
}
