import { mutation } from "./_generated/server";

// Helper: full YouTube URL from video ID
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// NOTE: Video IDs are BibleProject public videos — stable channel IDs.
// Verify each at youtube.com/watch?v=<ID> before shipping to production.
const VIDEOS = {
  // Fundamentos da Fé
  fe_natureza:   yt("WiOmNviFvsc"),
  fe_razao:      yt("swDHCr0Yzuc"),
  fe_graca:      yt("GQI72THyO5I"),
  fe_salvacao:   yt("T-x1BZL0Iac"),
  // Romanos
  rom_pecado:    yt("j-GCBF2hgj8"),
  rom_lei:       yt("p0dcL9KCCIY"),
  rom_mortos:    yt("q3m1DiYXLFU"),
  rom_espirito:  yt("E1qVOJkl3a0"),
  // Oração
  ora_porque:    yt("bGfTN5CuPT0"),
  ora_painosso:  yt("7Xf0gzHGLiI"),
  ora_jejum:     yt("rHKVH0KkFaY"),
  ora_interces:  yt("8oGESSqf3kI"),
  // Mulheres na Bíblia
  mul_sara:      yt("Dui4UD-QTEY"),
  mul_rute:      yt("rFt7Y4RELm4"),
  mul_maria:     yt("OkpU_1T3lEM"),
  mul_priscila:  yt("KalP_PinNks"),
  // Família
  fam_casamento: yt("Fhb9vBx3r3A"),
  fam_amor:      yt("NIq-NUh1LFI"),
  fam_filhos:    yt("oo2dGcUTaFk"),
  fam_conflitos: yt("g3NkoZHGkHs"),
  // Apocalipse
  apo_autor:     yt("O6O6BLqsQN8"),
  apo_igrejas:   yt("00sGEFzFaNc"),
  apo_selos:     yt("4hMKs3yNMkQ"),
  apo_nova:      yt("xmFPS9UmHpI"),
  // Introdução à Teologia
  teo_intro:     yt("fMoNRXzJJiU"),
  teo_escritura: yt("ak06MSETeo4"),
  // Salmos (Course 8)
  sal_intro:     yt("pRgLVFTCL1c"),
  sal_lamento:   yt("sVVoFYCqTCA"),
  sal_louvor:    yt("vYiaTsaEfBo"),
  sal_messias:   yt("FQ7bUHGvM2o"),
};

export const run = mutation({
  args: {},
  handler: async (ctx) => {

    // ===========================================================
    // CLEANUP — remove all previous seed data
    // ===========================================================

    const allUserBadges = await ctx.db.query("userBadges").collect();
    for (const ub of allUserBadges) await ctx.db.delete(ub._id);
    const allBadges = await ctx.db.query("badges").collect();
    for (const b of allBadges) await ctx.db.delete(b._id);

    const allUsers = await ctx.db.query("users").collect();
    const seedUsers = allUsers.filter((u) => u.clerkId.startsWith("seed_"));
    const seedUserIdSet = new Set(seedUsers.map((u) => u._id as string));

    const allCourses = await ctx.db.query("courses").collect();
    const seedCourses = allCourses.filter(
      (c) =>
        c.title.startsWith("[SEED]") ||
        (c.createdBy && seedUserIdSet.has(c.createdBy as string))
    );

    // Delete modules → lessons → quizzes / comments, then course enrollments
    for (const course of seedCourses) {
      const modules = await ctx.db
        .query("modules")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .collect();

      for (const mod of modules) {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", mod._id))
          .collect();

        for (const lesson of lessons) {
          const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
            .collect();
          for (const q of quizzes) await ctx.db.delete(q._id);

          const comments = await ctx.db
            .query("comments")
            .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
            .collect();
          for (const c of comments) await ctx.db.delete(c._id);

          await ctx.db.delete(lesson._id);
        }
        await ctx.db.delete(mod._id);
      }

      // Remove enrollments for this course
      const courseEnrollments = await ctx.db
        .query("enrollments")
        .filter((q) => q.eq(q.field("courseId"), course._id))
        .collect();
      for (const e of courseEnrollments) await ctx.db.delete(e._id);

      await ctx.db.delete(course._id);
    }

    // Delete per-user seed data
    for (const user of seedUsers) {
      const progress = await ctx.db
        .query("progress")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const p of progress) await ctx.db.delete(p._id);

      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const e of enrollments) await ctx.db.delete(e._id);

      const userBadges = await ctx.db
        .query("userBadges")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const ub of userBadges) await ctx.db.delete(ub._id);

      await ctx.db.delete(user._id);
    }

    // Delete forum posts by seed users
    const allPosts = await ctx.db.query("forumPosts").collect();
    for (const post of allPosts) {
      if (seedUserIdSet.has(post.authorId as string)) {
        const replies = await ctx.db
          .query("forumReplies")
          .withIndex("by_postId", (q) => q.eq("postId", post._id))
          .collect();
        for (const r of replies) await ctx.db.delete(r._id);
        await ctx.db.delete(post._id);
      }
    }

    // ===========================================================
    // PASTORS — with bios and social links
    // ===========================================================

    const pastor1 = await ctx.db.insert("users", {
      clerkId: "seed_pastor_joao",
      name: "Pastor João Silva",
      email: "joao@igrejabiblica.com",
      imageUrl: "https://i.pravatar.cc/150?img=11",
      bio: "Teólogo formado pelo Seminário Presbiteriano do Sul com mais de 20 anos de ministério. Especialista em hermenêutica bíblica e teologia sistemática, Pastor João dedica sua vida ao ensino das Escrituras com profundidade e clareza. Autor de três livros sobre os fundamentos da fé cristã e palestrante em conferências nacionais.",
      socialLinks: {
        instagram: "https://instagram.com/pastorjoaosilva",
        youtube: "https://youtube.com/@pastorjoaosilva",
        website: "https://pastorjoao.com.br",
      },
      xp: 1200,
      level: 6,
      streak: 14,
      role: "pastor",
    });

    const pastor2 = await ctx.db.insert("users", {
      clerkId: "seed_pastor_maria",
      name: "Pastora Maria Souza",
      email: "maria@igrejabiblica.com",
      imageUrl: "https://i.pravatar.cc/150?img=47",
      bio: "Pastora e conselheira cristã com pós-graduação em Aconselhamento Bíblico. Coordena o ministério de mulheres e família há 15 anos, impactando centenas de vidas com sua abordagem prática e compassiva da Palavra de Deus. Conferencista nacional e autora do livro 'Mulheres que Transformam'.",
      socialLinks: {
        instagram: "https://instagram.com/pastoramariasouza",
        facebook: "https://facebook.com/pastoramariasouza",
        youtube: "https://youtube.com/@pastoramaria",
      },
      xp: 800,
      level: 4,
      streak: 7,
      role: "pastor",
    });

    const pastor3 = await ctx.db.insert("users", {
      clerkId: "seed_pastor_carlos",
      name: "Pastor Carlos Lima",
      email: "carlos@igrejabiblica.com",
      imageUrl: undefined,
      bio: "Mestre em Teologia Bíblica pela PUC-Rio, Pastor Carlos é reconhecido por seu rigor acadêmico aliado a uma comunicação acessível. Especializado em literatura profética e apocalíptica, conduz estudos que transformam a maneira como os crentes leem e aplicam as profecias bíblicas no mundo contemporâneo.",
      socialLinks: {
        instagram: "https://instagram.com/pastorcarlosbiblia",
        website: "https://estudosbiblicospecarlos.com.br",
      },
      xp: 500,
      level: 3,
      streak: 3,
      role: "pastor",
    });

    // ===========================================================
    // MEMBERS (seed)
    // ===========================================================

    const member1 = await ctx.db.insert("users", {
      clerkId: "seed_member_ana",
      name: "Ana Costa",
      email: "ana@exemplo.com",
      imageUrl: "https://i.pravatar.cc/150?img=32",
      xp: 220,
      level: 2,
      streak: 5,
      role: "member",
    });

    const member2 = await ctx.db.insert("users", {
      clerkId: "seed_member_pedro",
      name: "Pedro Alves",
      email: "pedro@exemplo.com",
      imageUrl: "https://i.pravatar.cc/150?img=52",
      xp: 35,
      level: 1,
      streak: 2,
      role: "member",
    });

    const member3 = await ctx.db.insert("users", {
      clerkId: "seed_member_lucia", name: "Lúcia Ferreira",
      email: "lucia@exemplo.com", imageUrl: "https://i.pravatar.cc/150?img=44",
      xp: 420, level: 3, streak: 11, role: "member",
    });
    const member4 = await ctx.db.insert("users", {
      clerkId: "seed_member_rafael", name: "Rafael Nunes",
      email: "rafael@exemplo.com", imageUrl: "https://i.pravatar.cc/150?img=57",
      xp: 90, level: 1, streak: 0, role: "member",
    });
    const member5 = await ctx.db.insert("users", {
      clerkId: "seed_member_beatriz", name: "Beatriz Santos",
      email: "beatriz@exemplo.com", imageUrl: "https://i.pravatar.cc/150?img=36",
      xp: 680, level: 4, streak: 21, role: "member",
    });

    // ===========================================================
    // BADGES
    // ===========================================================

    const badge_primeiros_passos = await ctx.db.insert("badges", {
      name: "Primeiros Passos", description: "Completou sua primeira aula.", xpRequired: 10,
    });
    const badge_estudante = await ctx.db.insert("badges", {
      name: "Estudante Dedicado", description: "Completou um curso inteiro.", xpRequired: 100,
    });
    const badge_buscador = await ctx.db.insert("badges", {
      name: "Buscador da Palavra", description: "Alcançou 250 XP de aprendizado.", xpRequired: 250,
    });

    // ===========================================================
    // COURSE 1 — Fundamentos da Fé (Pastor João)
    // ===========================================================

    const course1 = await ctx.db.insert("courses", {
      title: "[SEED] Fundamentos da Fé Cristã",
      description: "Um curso introdutório sobre os pilares da fé cristã e como aplicá-los no cotidiano.",
      thumbnailUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600",
      welcomeVideoUrl: yt("H-IVpVTHSpA"),
      status: "published",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      createdBy: pastor1,
    });

    const c1m1 = await ctx.db.insert("modules", { courseId: course1, title: "Módulo 1 — O que é a fé cristã?", order: 1 });
    const c1m1l1 = await ctx.db.insert("lessons", { moduleId: c1m1, title: "A natureza da fé bíblica", videoUrl: VIDEOS.fe_natureza, order: 1 });
    const c1m1l2 = await ctx.db.insert("lessons", { moduleId: c1m1, title: "Fé e razão: um equilíbrio necessário", videoUrl: VIDEOS.fe_razao, order: 2 });
    const c1m2 = await ctx.db.insert("modules", { courseId: course1, title: "Módulo 2 — Graça e Salvação", order: 2 });
    const c1m2l1 = await ctx.db.insert("lessons", { moduleId: c1m2, title: "A doutrina da graça", videoUrl: VIDEOS.fe_graca, order: 1 });
    const c1m2l2 = await ctx.db.insert("lessons", { moduleId: c1m2, title: "A certeza da salvação", videoUrl: VIDEOS.fe_salvacao, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c1m1l1,
      questions: [
        { question: "O que é a fé segundo Hebreus 11:1?", options: ["A certeza das coisas que se esperam", "Um sentimento emocional", "Uma tradição religiosa", "Uma obra humana"], correctIndex: 0 },
        { question: "Qual é o objeto central da fé cristã?", options: ["A igreja", "Jesus Cristo", "A Bíblia", "Os milagres"], correctIndex: 1 },
      ],
    });
    await ctx.db.insert("quizzes", {
      lessonId: c1m1l2,
      questions: [
        { question: "Fé e razão são:", options: ["Incompatíveis", "Complementares", "Idênticas", "Independentes"], correctIndex: 1 },
        { question: "Quem disse 'Credo para entender'?", options: ["Calvino", "Lutero", "Agostinho de Hipona", "Tomás de Aquino"], correctIndex: 2 },
      ],
    });
    await ctx.db.insert("quizzes", {
      lessonId: c1m2l1,
      questions: [
        { question: "O que significa 'graça' no contexto bíblico?", options: ["Mérito humano", "Favor imerecido de Deus", "Uma oração específica", "Um ritual religioso"], correctIndex: 1 },
        { question: "Efésios 2:8-9 ensina que somos salvos por:", options: ["Obras", "Graça mediante a fé", "Batismo", "Participação na igreja"], correctIndex: 1 },
      ],
    });

    // ===========================================================
    // COURSE 2 — Romanos (Pastor João)
    // ===========================================================

    const course2 = await ctx.db.insert("courses", {
      title: "[SEED] Estudo do Livro de Romanos",
      description: "Uma análise profunda da epístola de Paulo aos Romanos, capítulo por capítulo.",
      thumbnailUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600",
      status: "published",
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      createdBy: pastor1,
    });

    const c2m1 = await ctx.db.insert("modules", { courseId: course2, title: "Módulo 1 — A condenação universal", order: 1 });
    const c2m1l1 = await ctx.db.insert("lessons", { moduleId: c2m1, title: "Todos pecaram (Rm 1–3)", videoUrl: VIDEOS.rom_pecado, order: 1 });
    const c2m1l2 = await ctx.db.insert("lessons", { moduleId: c2m1, title: "A lei e o pecado (Rm 4–5)", videoUrl: VIDEOS.rom_lei, order: 2 });
    const c2m2 = await ctx.db.insert("modules", { courseId: course2, title: "Módulo 2 — Vida em Cristo", order: 2 });
    const c2m2l1 = await ctx.db.insert("lessons", { moduleId: c2m2, title: "Mortos para o pecado (Rm 6–7)", videoUrl: VIDEOS.rom_mortos, order: 1 });
    const c2m2l2 = await ctx.db.insert("lessons", { moduleId: c2m2, title: "Vida no Espírito (Rm 8)", videoUrl: VIDEOS.rom_espirito, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c2m1l1,
      questions: [
        { question: "Qual é o tema central de Romanos 1–3?", options: ["A glória de Deus", "A condenação universal do pecado", "O amor de Deus", "Os dons do Espírito"], correctIndex: 1 },
        { question: "Romanos 3:23 declara que:", options: ["Apenas os gentios pecaram", "Todos pecaram e destituídos estão da glória de Deus", "Os judeus são justos", "O pecado não existe"], correctIndex: 1 },
      ],
    });
    await ctx.db.insert("quizzes", {
      lessonId: c2m1l2,
      questions: [
        { question: "Qual o papel da lei segundo Paulo em Romanos?", options: ["Salvar o homem", "Mostrar o pecado", "Substituir a graça", "Garantir a vida eterna"], correctIndex: 1 },
        { question: "Abraão foi justificado por:", options: ["Circuncisão", "Obras da lei", "Fé", "Sacrifícios"], correctIndex: 2 },
      ],
    });
    await ctx.db.insert("quizzes", {
      lessonId: c2m2l1,
      questions: [
        { question: "O que Paulo diz sobre nossa relação com o pecado em Rm 6?", options: ["Devemos pecar mais para a graça abundar", "Estamos mortos para o pecado", "O pecado ainda nos domina", "Devemos evitar o batismo"], correctIndex: 1 },
      ],
    });

    // ===========================================================
    // COURSE 3 — Oração (Pastor João)
    // ===========================================================

    const course3 = await ctx.db.insert("courses", {
      title: "[SEED] Oração e Vida Espiritual",
      description: "Desenvolvendo uma vida de oração consistente e transformadora.",
      thumbnailUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600",
      welcomeVideoUrl: yt("bGfTN5CuPT0"),
      status: "published",
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      createdBy: pastor1,
    });

    const c3m1 = await ctx.db.insert("modules", { courseId: course3, title: "Módulo 1 — Fundamentos da Oração", order: 1 });
    const c3m1l1 = await ctx.db.insert("lessons", { moduleId: c3m1, title: "Por que orar?", videoUrl: VIDEOS.ora_porque, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c3m1, title: "O Pai Nosso como modelo", videoUrl: VIDEOS.ora_painosso, order: 2 });
    const c3m2 = await ctx.db.insert("modules", { courseId: course3, title: "Módulo 2 — Oração Avançada", order: 2 });
    await ctx.db.insert("lessons", { moduleId: c3m2, title: "A prática do jejum bíblico", videoUrl: VIDEOS.ora_jejum, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c3m2, title: "Oração intercessória", videoUrl: VIDEOS.ora_interces, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c3m1l1,
      questions: [
        { question: "Qual é a principal razão para orar?", options: ["Conseguir bênçãos materiais", "Comunhão e relacionamento com Deus", "Mostrar religiosidade", "Afastar o diabo"], correctIndex: 1 },
        { question: "Jesus disse que era necessário orar sempre e:", options: ["Somente em público", "Sem desanimar", "Com muitas palavras", "Em silêncio absoluto"], correctIndex: 1 },
      ],
    });

    // ===========================================================
    // COURSE 4 — Mulheres na Bíblia (Pastora Maria)
    // ===========================================================

    const course4 = await ctx.db.insert("courses", {
      title: "[SEED] Mulheres na Bíblia",
      description: "A influência e o papel das mulheres ao longo das Escrituras Sagradas.",
      thumbnailUrl: "https://images.unsplash.com/photo-1459499362902-55a20553e082?w=600",
      status: "published",
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      createdBy: pastor2,
    });

    const c4m1 = await ctx.db.insert("modules", { courseId: course4, title: "Módulo 1 — Matriarcas do Antigo Testamento", order: 1 });
    const c4m1l1 = await ctx.db.insert("lessons", { moduleId: c4m1, title: "Sara: fé e promessa", videoUrl: VIDEOS.mul_sara, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c4m1, title: "Rute: lealdade e redenção", videoUrl: VIDEOS.mul_rute, order: 2 });
    const c4m2 = await ctx.db.insert("modules", { courseId: course4, title: "Módulo 2 — Mulheres no Novo Testamento", order: 2 });
    await ctx.db.insert("lessons", { moduleId: c4m2, title: "Maria Madalena: testemunha da ressurreição", videoUrl: VIDEOS.mul_maria, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c4m2, title: "Priscila: a mestra do evangelho", videoUrl: VIDEOS.mul_priscila, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c4m1l1,
      questions: [
        { question: "Sara era esposa de:", options: ["Moisés", "Abraão", "Isaque", "Jacó"], correctIndex: 1 },
        { question: "Qual foi o maior ato de fé de Sara?", options: ["Cruzar o Mar Vermelho", "Crer na promessa de um filho na velhice", "Construir o tabernáculo", "Proteger os profetas"], correctIndex: 1 },
      ],
    });

    // ===========================================================
    // COURSE 5 — Família segundo Deus (Pastora Maria)
    // ===========================================================

    const course5 = await ctx.db.insert("courses", {
      title: "[SEED] Família segundo Deus",
      description: "Princípios bíblicos para construir uma família saudável e fundamentada em Cristo.",
      thumbnailUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=600",
      status: "published",
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      createdBy: pastor2,
    });

    const c5m1 = await ctx.db.insert("modules", { courseId: course5, title: "Módulo 1 — O Casamento Cristão", order: 1 });
    const c5m1l1 = await ctx.db.insert("lessons", { moduleId: c5m1, title: "Casamento: origem e propósito", videoUrl: VIDEOS.fam_casamento, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c5m1, title: "Amor e compromisso bíblicos", videoUrl: VIDEOS.fam_amor, order: 2 });
    const c5m2 = await ctx.db.insert("modules", { courseId: course5, title: "Módulo 2 — Criando Filhos na Fé", order: 2 });
    await ctx.db.insert("lessons", { moduleId: c5m2, title: "Instrua a criança no caminho certo", videoUrl: VIDEOS.fam_filhos, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c5m2, title: "Conflitos familiares e restauração", videoUrl: VIDEOS.fam_conflitos, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c5m1l1,
      questions: [
        { question: "Segundo Gênesis, o casamento foi instituído por:", options: ["Moisés", "Deus desde a criação", "Os apóstolos", "A tradição judaica"], correctIndex: 1 },
        { question: "Em Efésios 5, o marido deve amar a esposa como:", options: ["Um líder a seus súditos", "Cristo amou a Igreja", "Um pai ama os filhos", "Os irmãos se amam"], correctIndex: 1 },
      ],
    });

    // ===========================================================
    // COURSE 6 — Apocalipse (Pastor Carlos)
    // ===========================================================

    const course6 = await ctx.db.insert("courses", {
      title: "[SEED] Apocalipse Desvendado",
      description: "Uma leitura contextual e histórica do livro do Apocalipse.",
      thumbnailUrl: undefined,
      status: "published",
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      createdBy: pastor3,
    });

    const c6m1 = await ctx.db.insert("modules", { courseId: course6, title: "Módulo 1 — Introdução ao Apocalipse", order: 1 });
    const c6m1l1 = await ctx.db.insert("lessons", { moduleId: c6m1, title: "Quem escreveu e para quem?", videoUrl: VIDEOS.apo_autor, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c6m1, title: "As sete igrejas da Ásia", videoUrl: VIDEOS.apo_igrejas, order: 2 });
    const c6m2 = await ctx.db.insert("modules", { courseId: course6, title: "Módulo 2 — Selos, Trombetas e Nova Criação", order: 2 });
    await ctx.db.insert("lessons", { moduleId: c6m2, title: "O Cordeiro e os sete selos", videoUrl: VIDEOS.apo_selos, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c6m2, title: "A nova Jerusalém", videoUrl: VIDEOS.apo_nova, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c6m1l1,
      questions: [
        { question: "Quem escreveu o Apocalipse?", options: ["Paulo", "Pedro", "João", "Tiago"], correctIndex: 2 },
        { question: "O Apocalipse foi escrito enquanto o autor estava em:", options: ["Éfeso", "Roma", "Patmos", "Antioquia"], correctIndex: 2 },
      ],
    });

    // ===========================================================
    // COURSE 7 — Introdução à Teologia (sem pastor)
    // ===========================================================

    const course7 = await ctx.db.insert("courses", {
      title: "[SEED] Introdução à Teologia",
      description: "Curso geral de introdução à teologia para novos membros.",
      thumbnailUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600",
      status: "published",
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    });

    const c7m1 = await ctx.db.insert("modules", { courseId: course7, title: "Módulo 1 — O que é Teologia?", order: 1 });
    const c7m1l1 = await ctx.db.insert("lessons", { moduleId: c7m1, title: "Definição e ramos da teologia", videoUrl: VIDEOS.teo_intro, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c7m1, title: "A autoridade das Escrituras", videoUrl: VIDEOS.teo_escritura, order: 2 });

    await ctx.db.insert("quizzes", {
      lessonId: c7m1l1,
      questions: [
        { question: "Teologia significa literalmente:", options: ["Estudo da religião", "Estudo sobre Deus (theos + logos)", "Ciência da fé", "Filosofia cristã"], correctIndex: 1 },
        { question: "A Bíblia é composta de quantos livros?", options: ["60", "66", "72", "80"], correctIndex: 1 },
      ],
    });

    // ===========================================================
    // COURSE 8 — Salmos (Pastor Carlos, draft)
    // ===========================================================

    const course8 = await ctx.db.insert("courses", {
      title: "[SEED] Salmos: Orações de Israel",
      description: "Uma introdução ao livro dos Salmos — seus gêneros, autores e mensagem teológica.",
      thumbnailUrl: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=600",
      status: "draft",
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      createdBy: pastor3,
    });
    const c8m1 = await ctx.db.insert("modules", { courseId: course8, title: "Módulo 1 — Introdução aos Salmos", order: 1 });
    const c8m1l1 = await ctx.db.insert("lessons", { moduleId: c8m1, title: "O que são os Salmos?", videoUrl: VIDEOS.sal_intro, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c8m1, title: "Os Salmos de Lamento", videoUrl: VIDEOS.sal_lamento, order: 2 });
    const c8m2 = await ctx.db.insert("modules", { courseId: course8, title: "Módulo 2 — Gêneros e Teologia", order: 2 });
    await ctx.db.insert("lessons", { moduleId: c8m2, title: "Salmos de Louvor e Ação de Graças", videoUrl: VIDEOS.sal_louvor, order: 1 });
    await ctx.db.insert("lessons", { moduleId: c8m2, title: "Os Salmos Messiânicos", videoUrl: VIDEOS.sal_messias, order: 2 });
    await ctx.db.insert("quizzes", {
      lessonId: c8m1l1,
      questions: [
        { question: "O livro dos Salmos está dividido em quantos livros internos?", options: ["3", "5", "7", "10"], correctIndex: 1 },
        { question: "Quem é o principal autor associado aos Salmos?", options: ["Salomão", "Moisés", "Davi", "Ezequias"], correctIndex: 2 },
      ],
    });

    // ===========================================================
    // ENROLLMENTS
    // ===========================================================

    // Ana: 4 courses (fully done / in-progress / zero-progress x2)
    await ctx.db.insert("enrollments", { userId: member1, courseId: course1, enrolledAt: Date.now() - 28 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member1, courseId: course3, enrolledAt: Date.now() - 18 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member1, courseId: course4, enrolledAt: Date.now() - 12 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member1, courseId: course5, enrolledAt: Date.now() - 11 * 24 * 60 * 60 * 1000 });

    // Pedro: 3 courses
    await ctx.db.insert("enrollments", { userId: member2, courseId: course2, enrolledAt: Date.now() - 9 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member2, courseId: course5, enrolledAt: Date.now() - 8 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member2, courseId: course6, enrolledAt: Date.now() - 5 * 24 * 60 * 60 * 1000 });

    // New members — one each
    await ctx.db.insert("enrollments", { userId: member3, courseId: course2, enrolledAt: Date.now() - 15 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member4, courseId: course1, enrolledAt: Date.now() - 4 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("enrollments", { userId: member5, courseId: course4, enrolledAt: Date.now() - 6 * 24 * 60 * 60 * 1000 });

    // ===========================================================
    // PROGRESS — aulas concluídas
    // ===========================================================

    // Ana: ALL 4 lessons of Course 1 complete (fully-completed course state)
    await ctx.db.insert("progress", { userId: member1, lessonId: c1m1l1, completed: true, quizScore: 2, completedAt: Date.now() - 26 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("progress", { userId: member1, lessonId: c1m1l2, completed: true, quizScore: 2, completedAt: Date.now() - 25 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("progress", { userId: member1, lessonId: c1m2l1, completed: true, quizScore: 2, completedAt: Date.now() - 22 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("progress", { userId: member1, lessonId: c1m2l2, completed: true, quizScore: 2, completedAt: Date.now() - 20 * 24 * 60 * 60 * 1000 });
    // Ana: 1 lesson of Course 3 done (in-progress state)
    await ctx.db.insert("progress", { userId: member1, lessonId: c3m1l1, completed: true, quizScore: 2, completedAt: Date.now() - 16 * 24 * 60 * 60 * 1000 });
    // Ana: Courses 4 & 5 enrolled, zero progress (enrolled-but-not-started state)

    // Pedro: 2 lessons of Course 2 done (module 1 complete, module 2 first lesson unlocked)
    await ctx.db.insert("progress", { userId: member2, lessonId: c2m1l1, completed: true, quizScore: 2, completedAt: Date.now() - 7 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("progress", { userId: member2, lessonId: c2m1l2, completed: true, quizScore: 1, completedAt: Date.now() - 6 * 24 * 60 * 60 * 1000 });
    // Pedro: first lesson of Course 5 done
    await ctx.db.insert("progress", { userId: member2, lessonId: c5m1l1, completed: true, quizScore: 1, completedAt: Date.now() - 6 * 24 * 60 * 60 * 1000 });

    // ===========================================================
    // LESSON COMMENTS
    // ===========================================================

    // c1m1l1 — 2 top-level comments, one with a pastor reply
    const comment1 = await ctx.db.insert("comments", {
      lessonId: c1m1l1, authorId: member1,
      body: "Pastor, quando Hebreus diz 'certeza das coisas que se esperam', isso elimina toda dúvida? Às vezes ainda tenho incertezas mesmo crendo...",
      createdAt: Date.now() - 24 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("comments", {
      lessonId: c1m1l1, authorId: pastor1, parentId: comment1,
      body: "A fé bíblica não é ausência de dúvidas — é confiança em quem Deus é, mesmo sem entender tudo. O próprio Tomé duvidou e Jesus o acolheu. Continue buscando!",
      createdAt: Date.now() - 23 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("comments", {
      lessonId: c1m1l1, authorId: member3,
      body: "Essa aula me ajudou a entender a diferença entre fé e credulidade cega. Obrigada Pastor João!",
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    });

    // c1m2l1 — 1 comment + 1 reply
    const comment2 = await ctx.db.insert("comments", {
      lessonId: c1m2l1, authorId: member2,
      body: "Qual a diferença entre graça comum e graça especial? Fiquei confuso nas distinções teológicas.",
      createdAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("comments", {
      lessonId: c1m2l1, authorId: pastor1, parentId: comment2,
      body: "Graça comum é o favor dado a todos (chuva, saúde, razão). Graça especial é a graça salvadora, dada por meio do evangelho. Estudaremos isso no próximo módulo!",
      createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    });

    // c2m1l1 — 1 comment + 2 replies
    const comment3 = await ctx.db.insert("comments", {
      lessonId: c2m1l1, authorId: member2,
      body: "Paulo inclui os judeus na condenação mesmo sendo o povo escolhido. Isso não contradiz a eleição de Israel?",
      createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("comments", {
      lessonId: c2m1l1, authorId: pastor1, parentId: comment3,
      body: "Eleição não é garantia de aprovação moral. Rm 2 mostra que ter a lei não significa cumpri-la. A eleição de Israel era para missão, não imunidade ao julgamento.",
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("comments", {
      lessonId: c2m1l1, authorId: member1, parentId: comment3,
      body: "Tive a mesma dúvida! O Pastor João explica bem isso no contexto de Romanos 9–11 também.",
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    });

    // ===========================================================
    // USER BADGES
    // ===========================================================

    // Ana: all 3 badges
    await ctx.db.insert("userBadges", { userId: member1, badgeId: badge_primeiros_passos, earnedAt: Date.now() - 26 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("userBadges", { userId: member1, badgeId: badge_estudante, earnedAt: Date.now() - 20 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("userBadges", { userId: member1, badgeId: badge_buscador, earnedAt: Date.now() - 19 * 24 * 60 * 60 * 1000 });
    // Pedro: first badge only
    await ctx.db.insert("userBadges", { userId: member2, badgeId: badge_primeiros_passos, earnedAt: Date.now() - 7 * 24 * 60 * 60 * 1000 });
    // Beatriz: first + third badge
    await ctx.db.insert("userBadges", { userId: member5, badgeId: badge_primeiros_passos, earnedAt: Date.now() - 10 * 24 * 60 * 60 * 1000 });
    await ctx.db.insert("userBadges", { userId: member5, badgeId: badge_buscador, earnedAt: Date.now() - 8 * 24 * 60 * 60 * 1000 });

    // ===========================================================
    // FORUM POSTS
    // ===========================================================

    const post1 = await ctx.db.insert("forumPosts", {
      authorId: member1,
      title: "Recursos para estudo bíblico diário — o que vocês usam?",
      body: "Olá irmãos! Estou tentando desenvolver uma rotina de estudo bíblico mais consistente. Tenho estudado no curso do Pastor João e adorei a abordagem. Alguém tem dicas de recursos complementares? Aplicativos, livros, planos de leitura...",
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("forumReplies", {
      postId: post1,
      authorId: member2,
      body: "Uso muito o YouVersion para planos de leitura! A comunidade aqui também tem me ajudado bastante. O curso de Oração do Pastor João mudou minha perspectiva sobre o tempo devocional.",
      createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("forumReplies", {
      postId: post1,
      authorId: pastor1,
      body: "Que alegria ver essa dedicação, Ana! Recomendo começar com o plano de leitura cronológica da Bíblia. Disponibilizarei um PDF de estudos complementares no próximo módulo. Continue assim!",
      createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    });

    const post2 = await ctx.db.insert("forumPosts", {
      authorId: member2,
      title: "Dúvida sobre Romanos 9 — predestinação?",
      body: "Tenho uma dúvida teológica sobre Romanos 9 e a questão da predestinação. 'Amarei a Jacó e odiarei a Esaú' — como interpretar isso sem cair em fatalismo? Alguém pode ajudar?",
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("forumReplies", {
      postId: post2,
      authorId: pastor1,
      body: "Ótima pergunta, Pedro! Romanos 9 deve ser lido no contexto dos capítulos 9–11 como um todo, tratando da soberania de Deus na história redentora de Israel — não do destino individual de cada pessoa. Abordarei isso em detalhes no próximo módulo do curso de Romanos!",
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    });
    await ctx.db.insert("forumReplies", {
      postId: post2,
      authorId: member1,
      body: "Tive a mesma dúvida! O Pastor João me recomendou o livro 'A Soberania de Deus' do Sproul — esclareceu muito.",
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    });

    const post3 = await ctx.db.insert("forumPosts", {
      authorId: member1,
      title: "Gratidão pelo curso Mulheres na Bíblia! ❤️",
      body: "Só queria registrar minha gratidão pelo curso da Pastora Maria. A aula sobre Rute me tocou profundamente — a história dela é um retrato lindo da fidelidade e da redenção. Obrigada por compartilhar esse conhecimento com tanto cuidado e carinho!",
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      pinned: true,
    });
    await ctx.db.insert("forumReplies", {
      postId: post3,
      authorId: pastor2,
      body: "Que mensagem linda, Ana! Fico muito feliz que o curso esteja sendo uma bênção. Rute é mesmo uma das histórias mais bonitas de toda a Escritura. Continuem estudando com esse coração aberto! ❤️",
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    });

    return [
      "✅ Seed completo!",
      `   • 3 pastores (com bio e redes sociais)`,
      `   • 5 membros seed`,
      `   • 7 cursos publicados + 1 rascunho`,
      `   • 2 cursos com welcomeVideoUrl`,
      `   • 16 módulos / 30 aulas`,
      `   • 10 matrículas`,
      `   • 8 registros de progresso`,
      `   • 3 badges + 6 userBadge atribuições`,
      `   • 6 comentários em aulas (com respostas)`,
      `   • 3 posts no fórum`,
    ].join("\n");
  },
});
