1. Version 0.0.2 delivers a configurable list of muds in frontend/config/config.development, so that the development mode can be used as local browser-mudclient to multiple muds.
2. Version 0.0.3 added ANSI colour support
3. Version 0.0.4 fixed an ANSI colour issue and renamed frontend dir to backend.
4. Version 0.0.5 implmented telnet_neg: echo,terminaltype and naws. started with GMCP support.
5. Version 0.0.6 implemented sound on top of GMCP, working with UNItopia so far.
6. Version 0.0.7 Rewrite for portal and created dockerfile.
7. Version 0.0.8-0.0.10: Getting docker configuration to run on UNItopia.de
8. Version 0.0.11: Enabling CORS. 
9. Version 0.0.12: bugfix CORS.
10. Version 0.0.13: polyfill for IE11,10,9.
11. Version 0.0.14: Bugfixes favicon,title,config
12. Version 0.0.15: invert foreground, if forground is identical to background color. shorten input-line. on enter return on output (input_to-issue)
13. Version 0.0.16: dynamic height of mud window, fixed monotype size fixing ie+edge, fewer logs
14. Version 0.0.17: Redesign and Test of new mudwindow width and heigths calculation
15. Version 0.0.18: Menu: Connect,Disconnect,Invert,BlackOnWhite. Windows-Sizing revisited, Serverloggin enhanced. more robust disconnects(on-going).
16. Version 0.0.19: Experiments and Tests with gracefully exits.
17. Version 0.0.20/21: Experiments with scrollbars/tooltips, update angular to 6.1.10
18. Version 0.0.22/23: Finally get some scrollbars activated for Safari.
19. Version 0.0.24: GMCP-Ping,GMVP-GoodBye and request more GMCP Modules from MUD (Ongoing)
20. Version 0.0.25: Bugfixing BlackOnWhite,Colours. Start with non modal windows (Ongoing)
21. Version 0.0.26: first configruable gmcp module sound (switch off/on)
22. Version 0.0.27/28: upgrade UI(angular 6) to UI7 (angular7), testing mdconn Service to connect via pipe to Orbit
23. Version 0.0.29-0.0.36: Big switch to productive Apache redirection on UNItopia server. 
24. Version 0.0.37: Directory and filess/edit modules