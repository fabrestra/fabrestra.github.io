/* Local working CMS links never masquerade as public deployment. */
if(['127.0.0.1','localhost'].includes(location.hostname)){
 document.querySelector('#native-actions').hidden=false;
 document.querySelector('#native-scope').textContent='Журнал запущен отдельно на порту 8946. Он доступен только на этом компьютере; снимки ниже можно показать без доступа к панели.';
}

