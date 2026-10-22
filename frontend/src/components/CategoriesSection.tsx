// CategoriesSection
// Generado automáticamente desde code.html y adaptado a JSX + TypeScript.

export function CategoriesSection() {
  return (
    <>
      {/* 3. MANTENER SECCIÓN DE CATEGORÍAS DEPORTIVAS: 6 DISCIPLINAS */}
      <section
        className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14"
        id="categorias"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Explora por disciplina
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-headline-lg">
              Categorías Deportivas
            </h2>
          </div>
          <a
            className="text-secondary dark:text-blue-400 hover:text-primary font-semibold text-sm inline-flex items-center gap-1 group"
            href="#catalogo"
          >
            <span className="">Ver todas las disciplinas</span>
            <span
              className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform"
              data-icon="arrow_forward"
            >
              arrow_forward
            </span>
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. Fitness / Gimnasio */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#fitness"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXvC5h1Ws9dTKONNoMOhwVgq1HvQX5c6MU2DBpiyTwBMlOTsN0hsq0ND2Olj5HOLW9HTdFN0Mr-KmxnRimm1xJatKN8cwT3M-wa4xygWl5WJC5kR5w72PIm7QWJawwE_O_eex1-bywMJ_kA_LNqvVVQmMYrPOfUbxiByklKNE9O2z2W45pa0pH3lwR96rZQG4zqrrQ_QnyQGFBc7f0rGMWzGdLW3sDP_1jAig8ws06hWpW2scuEmqV')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Fitness / Gimnasio
              </h3>
              <p className="text-[11px] text-slate-300">142 artículos</p>
            </div>
          </a>
          {/* 2. Running */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#running"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA4i7ZtESwRjATzaJanO8TYKqYdnO-LC5BV42O5WyDDcTdTzno2uYSYZ1NmXY8b5yjoGyXofuw3HylJ99e6TiDVs2nQJSo0T389BSUvj9g8C5qy8aSz1vymko6M8EiNAcnDDIMqQB1FfjQ-uhzLT07WGpCvBGdK3-d7GogyJEZJ0yPgwx7NOGkh8iSc3yNXGj2w1hSDvDsBPUiFLjt3Ye4qs2u3jwOr2uvqFkLk0d_oXaeIhpJw0xjW')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Running
              </h3>
              <p className="text-[11px] text-slate-300">89 artículos</p>
            </div>
          </a>
          {/* 3. Athleisure / Casual */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#athleisure"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6xD6vQRbgCOQY5RE_qKMJ7fiahQo1lhtWHw917T4uz54HxGnDN6B-dhjgo8fdvShw3TtizPXeT-lOsMmoILM6A7ij7ZXiBIohEkE6Cm_FtWCIvi4taRFobxL6DSjHP8NB3zVHvnmmIrhlIjPzF_v3ioZNzaJgOah_stvkU4_T-k4OQlOTi3kgctp2ISYZjGIdW7HvJBL-fkVrEWn324G7S8CTrWpIJjvd9my9H-kQh6FPorOq19V4')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Athleisure / Casual
              </h3>
              <p className="text-[11px] text-slate-300">115 artículos</p>
            </div>
          </a>
          {/* 4. Fútbol */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#futbol"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAXIvsyZW2P-7HQ0ZtyXRtn3ppTm6VnvqjJvjPB_4azGqa5qn87Tsf9Kbtp3bxoc2nTzeNLbUvGKuTL8Hx5imQy8ubkP9WrtOKZ5YDAx1f77GcgB88LXQ9sKoV4q2RbRwWvcQz28aJTY5Bu_TL_kiJMSc-GtH5h7RNw9tNKLgDgwC-JSv-uHZ3D1Ue520Hy9x-K_eOhBuQH_B1dsTxmDJVCstVz5OWVsHYBFZ7HIaBzrSJyDe95y2v7')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Fútbol
              </h3>
              <p className="text-[11px] text-slate-300">64 artículos</p>
            </div>
          </a>
          {/* 5. CrossFit / Entrenamiento */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#crossfit"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA00j2oBRRM3Jd7Kq8q8-DZ42G92wXjsn2FobdWmfkx5SaBu35QtBB4kznthRkqXCIQ4eDx2GZU0gU4_DIjZFYFF_fZ9Wu_kQsD0P8-hHp5BHj0W3uJXEWcsYsLHcHSJLAFLGsQdV_qSP8S1se-vPDj_twi9sShqdbAK4C1tGMUqz69ZuKiDnze686qb1zV4ufOr0qsWbR1IuTG0-zHJHytoZ2yFm0bXNC__q7x_vp8lNCbf9Wsv34f')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                CrossFit / Entreno
              </h3>
              <p className="text-[11px] text-slate-300">78 artículos</p>
            </div>
          </a>
          {/* 6. Outdoor */}
          <a
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-4 hover:shadow-lg transition-all"
            href="#outdoor"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out opacity-85"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDoNTQS-oLF6cHjZGSuZFtQ5y1HngYvldT0jn49T6R5aEJRU2AZUevTUtqGdTz2eMV1NNX0P_KE40KNKCWPs_ilAUqL2HM8JWvog9vrN1Ho2zyJBqKIrcblIqX5BctbMb1FQwftjyIBW4Suq0bqc9LSUlWc6_sdwESoQluY8aUk-uYW9MXqyoHZb5E77X5xjcKFl88_CXAAex4Ry7CasmDDWvXYcEBZnpRtCxWzq25x1K2L018233EN')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 text-white">
              <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                Outdoor
              </h3>
              <p className="text-[11px] text-slate-300">93 artículos</p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
