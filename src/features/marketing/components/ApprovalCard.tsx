/**
 * The tilted approval card over the hero board (a picture, not real buttons).
 * Laptop and tablet: overlaps the board's lower right, tilted −2°. Phone: sits under the board.
 */
export function ApprovalCard() {
  return (
    <div className="absolute right-0 bottom-0 flex w-[300px] -rotate-2 flex-col gap-3 rounded-feature bg-card p-4 shadow-float phone:static phone:mt-3 phone:w-auto phone:rotate-0">
      <div className="flex items-center gap-[10px]">
        <span className="flex size-[30px] items-center justify-center rounded-switch bg-peach-2 text-[11px] font-bold text-peach-ink">
          BB
        </span>
        <span className="flex flex-col">
          <span className="text-[13px] font-semibold">Homepage design, v2</span>
          <span className="text-[11px] text-muted">Waiting on Brightline Bakery</span>
        </span>
      </div>
      <div className="flex gap-2">
        <span className="flex-1 rounded-switch bg-violet p-2 text-center text-xs font-medium text-white">Approve</span>
        <span className="flex-1 rounded-switch border border-line-strong p-2 text-center text-xs font-medium">
          Request changes
        </span>
      </div>
    </div>
  );
}
