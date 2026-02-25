import { Link } from "react-router-dom";

type Props = { _id: string; name: string; imageUrl?: string };

export default function PastorCard({ _id, name, imageUrl }: Props) {
  return (
    <Link to={`/pastores/${_id}`} className="flex flex-col items-center gap-2 group">
      <div className="w-16 h-16 rounded-full ring-2 ring-amber-400/40 group-hover:ring-amber-400 transition-all flex-shrink-0">
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-amber-400 font-bold text-xl">{name[0]}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-slate-300 text-center max-w-[72px] truncate group-hover:text-white transition-colors">{name}</span>
    </Link>
  );
}
