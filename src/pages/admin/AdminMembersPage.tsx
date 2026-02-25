import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import AdminLayout from "../../components/admin/AdminLayout";
import { getLevelInfo } from "../../lib/levels";

type SocialLinks = {
  instagram: string;
  youtube: string;
  facebook: string;
  twitter: string;
  website: string;
};

type ProfileDraft = { bio: string; socialLinks: SocialLinks };

function initDraft(member: { bio?: string; socialLinks?: Partial<SocialLinks> }): ProfileDraft {
  const sl = member.socialLinks ?? {};
  return {
    bio: member.bio ?? "",
    socialLinks: {
      instagram: sl.instagram ?? "",
      youtube: sl.youtube ?? "",
      facebook: sl.facebook ?? "",
      twitter: sl.twitter ?? "",
      website: sl.website ?? "",
    },
  };
}

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "youtube",   label: "YouTube",   placeholder: "https://youtube.com/..."   },
  { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/..."  },
  { key: "twitter",   label: "Twitter / X", placeholder: "https://x.com/..."      },
  { key: "website",   label: "Site",      placeholder: "https://..."               },
];

export default function AdminMembersPage() {
  const members = useQuery(api.users.listAll);
  const updateRole = useMutation(api.users.updateRole);
  const updatePastorProfile = useMutation(api.users.updatePastorProfile);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ProfileDraft>>({});

  const filtered = (members ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  function getDraft(member: typeof filtered[number]): ProfileDraft {
    return drafts[member._id as string] ?? initDraft(member as Parameters<typeof initDraft>[0]);
  }

  function setDraftBio(memberId: string, bio: string, member: typeof filtered[number]) {
    setDrafts((prev) => ({
      ...prev,
      [memberId]: { ...(prev[memberId] ?? initDraft(member as Parameters<typeof initDraft>[0])), bio },
    }));
  }

  function setDraftSocial(memberId: string, field: keyof SocialLinks, value: string, member: typeof filtered[number]) {
    setDrafts((prev) => {
      const existing = prev[memberId] ?? initDraft(member as Parameters<typeof initDraft>[0]);
      return {
        ...prev,
        [memberId]: { ...existing, socialLinks: { ...existing.socialLinks, [field]: value } },
      };
    });
  }

  async function handleRoleChange(userId: Id<"users">, newRole: "admin" | "pastor" | "member") {
    await updateRole({ userId, role: newRole });
  }

  async function handleSaveProfile(member: typeof filtered[number]) {
    const draft = getDraft(member);
    const sl = draft.socialLinks;
    await updatePastorProfile({
      userId: member._id,
      bio: draft.bio,
      socialLinks: {
        instagram: sl.instagram || undefined,
        youtube:   sl.youtube   || undefined,
        facebook:  sl.facebook  || undefined,
        twitter:   sl.twitter   || undefined,
        website:   sl.website   || undefined,
      },
    });
  }

  return (
    <AdminLayout title="Membros">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
        />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Nível</th>
                <th className="px-5 py-3 font-medium">XP</th>
                <th className="px-5 py-3 font-medium">Sequência</th>
                <th className="px-5 py-3 font-medium">Função</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members === undefined && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Carregando membros...
                  </td>
                </tr>
              )}
              {filtered.length === 0 && members !== undefined && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((member) => {
                const { current } = getLevelInfo(member.xp);
                const isPastor = member.role === "pastor" || member.role === "admin";
                const draft = getDraft(member);
                return (
                  <>
                    <tr key={member._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{member.name}</td>
                      <td className="px-5 py-3 text-slate-400">{member.email}</td>
                      <td className="px-5 py-3 text-amber-400">
                        {current.level} · {current.name}
                      </td>
                      <td className="px-5 py-3 text-slate-300">{member.xp} XP</td>
                      <td className="px-5 py-3 text-slate-300">🔥 {member.streak}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.role === "admin"
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : member.role === "pastor"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {member.role === "admin" ? "Admin" : member.role === "pastor" ? "Pastor" : "Membro"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member._id, e.target.value as "admin" | "pastor" | "member")}
                          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 transition-colors"
                        >
                          <option value="member">Membro</option>
                          <option value="pastor">Pastor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>

                    {isPastor && (
                      <tr key={`${member._id}-profile`} className="bg-slate-900/50">
                        <td colSpan={7} className="px-5 pb-5 pt-2">
                          <div className="space-y-3">
                            {/* Bio */}
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Bio</label>
                              <textarea
                                rows={2}
                                value={draft.bio}
                                onChange={(e) => setDraftBio(member._id as string, e.target.value, member)}
                                placeholder="Escreva uma bio para este pastor..."
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 resize-none"
                              />
                            </div>

                            {/* Social links */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                                <div key={key}>
                                  <label className="block text-xs text-slate-500 mb-1">{label}</label>
                                  <input
                                    type="url"
                                    value={draft.socialLinks[key]}
                                    onChange={(e) => setDraftSocial(member._id as string, key, e.target.value, member)}
                                    placeholder={placeholder}
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSaveProfile(member)}
                                className="text-xs bg-amber-400 text-slate-950 font-semibold px-5 py-2 rounded-lg hover:bg-amber-300 transition-colors"
                              >
                                Salvar perfil
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-slate-600 text-xs">
          {filtered.length} membro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
    </AdminLayout>
  );
}
