#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <sys/resource.h>
#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/syscall.h>
#include <sys/reg.h>
#include <sys/user.h>

#ifdef __x86_64__
#define SCN (ORIG_RAX << 3)
#define SCR (RAX << 3)
#else
#define SCN  (ORIG_EAX << 2)
#define SCR (EAX << 2)
#endif

#define FORK 1
#define BAD  2

static int _max = 0;

static pid_t _pid = 0;

static int _bad[512] = {
    [__NR_clone]                            FORK,
    [__NR_fork]                             FORK,
    [__NR_vfork]                            FORK,
    [__NR_kill]                             BAD,
    [__NR_setsid]                           BAD,
};

static int _sig[] = {
    SIGHUP, SIGINT, SIGQUIT, SIGILL, 
    SIGTRAP, SIGABRT, SIGIOT, SIGBUS, 
    SIGFPE, SIGUSR1, SIGSEGV, SIGUSR2, 
    SIGPIPE, SIGALRM, SIGTERM, SIGSTKFLT, 
    SIGXCPU, SIGXFSZ, SIGVTALRM, SIGPROF,
};

void handler(int sig){
    if(_max <= 1){
        kill(0, SIGKILL);
    }else if(_pid > 0){
        kill(_pid, SIGTERM);
    }
}

int limit(int resource, rlim_t max){
    struct rlimit l;
    l.rlim_cur = max;
    l.rlim_max = max;
    return setrlimit(resource, &l);
}

int main(int argc, char **argv)
{
    pid_t npid, cpid;
    int s, ns, cs, fc, cc, scn, scr, i;
    if(argc < 3){
        return 1;
    }
    _max = atoi(argv[1]);
    if(_max < 0){
        return 1;
    }
    setsid();
    for(i = 0; i < sizeof(_sig) / sizeof(int); ++i){
        signal(_sig[i], handler);
    }
    //limit(RLIMIT_NPROC, 64);
    if(_max == 0){
        limit(RLIMIT_AS, 32 * 1024 * 1024);
    }
    limit(RLIMIT_CPU, 1);
    _pid = fork();
    if(_pid < 0){
        return 1;
    }
    if(_pid == 0){
        if(_max <= 1){
            ptrace(PTRACE_TRACEME, 0, NULL, NULL);
        }
        execv(argv[2], argv + 2);
    }
    cc = 1;
    fc = 0;
    while(cc > 0){
        cpid = wait3(&cs, 0, NULL);
        if(WIFEXITED(cs)){
            --cc;
            if(cpid == _pid){
                s = cs;
            }
            continue;
        }
        if(WIFSIGNALED(cs)){
            kill(0, WTERMSIG(cs));
        }
        if(_max <= 1){
            scn = ptrace(PTRACE_PEEKUSER, cpid, SCN, NULL);
            if(_bad[scn] == FORK){
                scr = ptrace(PTRACE_PEEKUSER, cpid, SCR, NULL);
                if(scr > 0){
                    ++cc;
                    if(!_max){
                        ptrace(PTRACE_ATTACH, scr, NULL, NULL);
                    }
                    ptrace(PTRACE_SYSCALL, cpid, NULL, NULL);
                }else if(fc < _max){
                    ++fc;
                    ptrace(PTRACE_SYSCALL, cpid, NULL, NULL);   
                }else{
                    kill(0, SIGKILL);
                }
            }else if(_bad[scn]){
                kill(0, SIGKILL);
            }else{
                ptrace(PTRACE_SYSCALL, cpid, NULL, NULL);
            }        
        }
    }
    return WEXITSTATUS(s);
}
