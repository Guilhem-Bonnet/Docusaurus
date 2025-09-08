const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

function shEscape(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

module.exports = function (context, options) {
  return {
    name: 'git-lastupdate',
    async contentLoaded({ actions }) {
      const { createData } = actions;
      const siteDir = context.siteDir;
      const docsDir = path.join(siteDir, 'docs');

      const walk = (dir) => {
        const files = [];
        if (!fs.existsSync(dir)) return files;
        for (const name of fs.readdirSync(dir)) {
          const p = path.join(dir, name);
          const st = fs.statSync(p);
          if (st.isDirectory()) files.push(...walk(p));
          else if (st.isFile() && /\.(md|mdx)$/.test(p)) files.push(p);
        }
        return files;
      };

      const files = walk(docsDir);
      if (process.env.DEBUG_GIT_LASTUPDATE) {
        // eslint-disable-next-line no-console
        console.error('git-lastupdate files count=', files.length);
        // eslint-disable-next-line no-console
        console.error('git-lastupdate sample files=', files.slice(0, 10));
      }
      const map = {};

      // Determine repository top-level once. This avoids confusing .git
      // artefacts under docs/ and is more robust in containerized builds.
      let repoRoot = null;
      try {
        const out = execFileSync('git', ['-C', siteDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
        if (out) repoRoot = out;
      } catch (err) {
        if (process.env.DEBUG_GIT_LASTUPDATE) {
          // eslint-disable-next-line no-console
          console.error('could not determine repo root, git not available or not a repo', err && err.message ? err.message : err);
        }
      }

      for (const abs of files) {
        const gitRoot = repoRoot || siteDir;
        const relToRepo = path.relative(gitRoot, abs);
        try {
          let author = null;
          let at = null;

          // Check whether the file is tracked by git. If it's not tracked
          // we will try to find the nearest tracked ancestor (directory)
          // and use its last committer as a reasonable approximation.
          let isTracked = false;
          try {
            const lsOut = execFileSync('git', ['-C', gitRoot, 'ls-files', '--', relToRepo], { encoding: 'utf8' }).trim();
            isTracked = !!lsOut;
          } catch (e) {
            // ignore
          }

          // Decide which path to ask git about: the file itself if tracked,
          // otherwise climb to the nearest ancestor that is tracked.
          let gitPath = relToRepo;
          if (!isTracked) {
            let parts = relToRepo.split(/[\\/]+/);
            while (parts.length > 0) {
              parts.pop();
              const candidate = parts.length > 0 ? parts.join('/') : '.';
              try {
                const lsOut = execFileSync('git', ['-C', gitRoot, 'ls-files', '--', candidate], { encoding: 'utf8' }).trim();
                if (lsOut) {
                  gitPath = candidate;
                  isTracked = true;
                  break;
                }
              } catch (e) {
                // ignore and continue climbing
              }
            }
          }

          // Primary attempt: follow renames and prefer committer unix timestamp and author
          try {
            const args = ['-C', gitRoot, 'log', '--follow', '-1', '--pretty=format:%an||%ct', '--', gitPath];
            if (process.env.DEBUG_GIT_LASTUPDATE) {
              // eslint-disable-next-line no-console
              console.error('git cmd args:', args.join(' '));
            }
            const out = execFileSync('git', args, { encoding: 'utf8' }).trim();
            if (out) {
              const parts = out.split('||');
              author = parts[0] || null;
              at = parts[1] || null;
            }
          } catch (err) {
            if (process.env.DEBUG_GIT_LASTUPDATE) {
              // eslint-disable-next-line no-console
              console.error('git command failed:', err && err.message ? err.message : err);
            }
          }

          // Fallbacks for timestamp and author (try separate queries)
          if (!at) {
            try {
              const outTs = execFileSync('git', ['-C', gitRoot, 'log', '--follow', '-1', '--pretty=format:%ct', '--', gitPath], { encoding: 'utf8' }).trim();
              if (outTs) at = outTs;
            } catch (e) {
              // ignore
            }
          }

          if (!author) {
            try {
              const outAuth = execFileSync('git', ['-C', gitRoot, 'log', '--follow', '-1', '--pretty=format:%an', '--', gitPath], { encoding: 'utf8' }).trim();
              if (outAuth) author = outAuth;
            } catch (e) {
              // ignore
            }
          }

          if (!at) {
            try {
              const outAd = execFileSync('git', ['-C', gitRoot, 'log', '--follow', '-1', '--pretty=format:%ad', '--date=unix', '--', gitPath], { encoding: 'utf8' }).trim();
              if (outAd) at = outAd;
            } catch (e) {
              // ignore
            }
          }

          // If still no author found, try repo-level last committer or git config
          if (!author) {
            try {
              const repoLast = execFileSync('git', ['-C', gitRoot, 'log', '-1', '--pretty=format:%an'], { encoding: 'utf8' }).trim();
              if (repoLast) {
                author = repoLast;
              }
            } catch (e) {
              // ignore
            }
          }

          if (!author) {
            try {
              const cfg = execFileSync('git', ['-C', gitRoot, 'config', 'user.name'], { encoding: 'utf8' }).trim();
              if (cfg) author = cfg;
            } catch (e) {
              // ignore
            }
          }

          // Filesystem mtime fallback for timestamp
          if (!at) {
            try {
              const st = fs.statSync(abs);
              if (st && st.mtimeMs) {
                at = Math.floor(st.mtimeMs / 1000).toString();
                if (process.env.DEBUG_GIT_LASTUPDATE) {
                  // eslint-disable-next-line no-console
                  console.error('git-lastupdate: using fs mtime fallback for', relToRepo, '=>', at);
                }
              }
            } catch (e) {
              // ignore
            }
          }

          const relToDocs = path.relative(docsDir, abs).replace(/\\+/g, '/').replace(/\.(md|mdx)$/, '');
          map[relToDocs] = {
            author: author || null,
            timestamp: at ? parseInt(at, 10) : null,
          };
        } catch (e) {
          if (process.env.DEBUG_GIT_LASTUPDATE) {
            // eslint-disable-next-line no-console
            console.error('git-lastupdate error for', abs, e && e.message ? e.message : e);
          }
        }
      }

      // Fallback : si aucune entrée trouvée, essayer de récupérer au moins l'auteur
      // en utilisant `git log --pretty=format:%an` pour chaque fichier.
      if (Object.keys(map).length === 0) {
        if (process.env.DEBUG_GIT_LASTUPDATE) {
          // eslint-disable-next-line no-console
          console.error('git-lastupdate: using author-only fallback for', files.length, 'files');
        }
        for (const abs of files) {
          const gitRoot = repoRoot || siteDir;
          const relToRepo = path.relative(gitRoot, abs);
          try {
            const cmd = 'git -C ' + shEscape(gitRoot) + ' log -1 --pretty=format:%an -- ' + shEscape(relToRepo);
            if (process.env.DEBUG_GIT_LASTUPDATE) {
              // eslint-disable-next-line no-console
              console.error('git fallback cmd:', cmd);
            }
            const out = execSync(cmd, { encoding: 'utf8' });
            const author = (typeof out === 'string' ? out : String(out)).trim();
            if (!author) continue;
            const relToDocs = path.relative(docsDir, abs).replace(/\\+/g, '/').replace(/\.(md|mdx)$/, '');
            // try to get a timestamp even when using author-only fallback
            let ts = null;
            try {
              const cmdTs = 'git -C ' + shEscape(gitRoot) + ' log -1 --pretty=format:%ct -- ' + shEscape(relToRepo);
              const outTs = execSync(cmdTs, { encoding: 'utf8' }).trim();
              if (outTs) ts = outTs;
            } catch (e) {
              // ignore
            }
            if (!ts) {
              try {
                const cmdAd = 'git -C ' + shEscape(gitRoot) + ' log -1 --pretty=format:%ad --date=unix -- ' + shEscape(relToRepo);
                const outAd = execSync(cmdAd, { encoding: 'utf8' }).trim();
                if (outAd) ts = outAd;
              } catch (e) {
                // ignore
              }
            }
            if (process.env.DEBUG_GIT_LASTUPDATE) {
              // eslint-disable-next-line no-console
              console.error('git-lastupdate FOUND (fallback):', relToDocs, '=>', author, ' ts=', ts);
            }
            map[relToDocs] = { author: author || null, timestamp: ts ? parseInt(ts, 10) : null };
          } catch (err) {
            if (process.env.DEBUG_GIT_LASTUPDATE) {
              // eslint-disable-next-line no-console
              console.error('git-lastupdate fallback failed for', abs, err && err.stderr ? String(err.stderr) : String(err));
            }
          }
        }
      }

      // write under folder matching plugin name so the theme can require('@generated/git-lastupdate/lastUpdates.json')
      const json = JSON.stringify(map, null, 2);
      await createData('git-lastupdate/lastUpdates.json', json);

      // Also write a physical copy into @generated/git-lastupdate so
      // eval(require('@generated/...')) can resolve the file during the
      // bundling step in some environments.
      try {
        const generatedDir = path.join(siteDir, '@generated', 'git-lastupdate');
        if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
        const outPath = path.join(generatedDir, 'lastUpdates.json');
        fs.writeFileSync(outPath, json, { encoding: 'utf8' });
        if (process.env.DEBUG_GIT_LASTUPDATE) {
          // eslint-disable-next-line no-console
          console.error('wrote physical generated file:', outPath);
        }
      } catch (e) {
        if (process.env.DEBUG_GIT_LASTUPDATE) {
          // eslint-disable-next-line no-console
          console.error('failed to write @generated copy:', e && e.message ? e.message : e);
        }
      }
      // Also write a static copy into the site's static/ so the file
      // will be available at runtime under /git-lastupdate/lastUpdates.json
      try {
        const staticDir = path.join(siteDir, 'static', 'git-lastupdate');
        if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });
        const staticOut = path.join(staticDir, 'lastUpdates.json');
        fs.writeFileSync(staticOut, json, { encoding: 'utf8' });
        if (process.env.DEBUG_GIT_LASTUPDATE) {
          // eslint-disable-next-line no-console
          console.error('wrote static copy:', staticOut);
        }
      } catch (e) {
        if (process.env.DEBUG_GIT_LASTUPDATE) {
          // eslint-disable-next-line no-console
          console.error('failed to write static copy:', e && e.message ? e.message : e);
        }
      }
    },
  };
};


// end of file

