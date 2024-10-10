const { ipcRenderer } = require('electron')


document.addEventListener('DOMContentLoaded', () => {

    window.loaded_at = Date.now();
    setInterval(() => {
        if ((Date.now() - window.loaded_at) > 1000 * 60 * 10) {
            window.location.reload();
        };
    }, 10000);

    /**
     * 
     * @param {HTMLElement} node 
     */
    function get_job_from_html(index) {
        const section_selector = `[data-test="job-tile-list"] > section:nth-child(${index})`;
        const posted_at = document.querySelector(`${section_selector} > div > div span`)?.innerText;
        const title = document.querySelector(`${section_selector} > div > div h3`)?.innerText;
        const detail = document.querySelector(`${section_selector} > div:nth-child(2) > div:nth-child(2)`)?.innerText
        let link = document.querySelector(`${section_selector} > div > div h3 a`)?.getAttribute('href')
        link = `https://www.upwork.com${link}`
        let rating = document.querySelector(`${section_selector} .air3-rating-foreground`)?.clientWidth / document.querySelector(`${section_selector} .air3-rating-background`)?.clientWidth ?? 1
        if (rating) rating = (rating * 5).toFixed(1) * 1
        const price = document.querySelector(`${section_selector} > div:nth-child(2) > div`)?.innerText;
        const proposal = document.querySelector(`${section_selector} > div:nth-child(2) > div:nth-child(5) strong`)?.innerText
        const country = document.querySelector(`${section_selector} [data-test="client-country"]`)?.innerText
        const job = {
            title, posted_at, rating, price, proposal, country, link, detail
        }

        return job
    }

    /**
     * 
     * @param {Object} job 
     * 
     * @returns {Notification}
     */
    function notify(job) {
        return new Notification(job.title, {
            body: `📅  ${job.posted_at}\n✍️  Proposal ${job.proposal}\n🚩${job.country}\t ★✰  ${job.rating}\n💶  ${job.price}\n ${job.detail}`
        });
    }

    /**
     * 
     * @param {Object} params 
     * @returns {string}
     */
    function job_key(job) {
        return `${job.title}_${job.country}_${job.price}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    }

    function process_jobs(index = 1) {
        const total = document.querySelectorAll('[data-test="job-tile-list"] > section').length
        if (!total) return reload_in(1);
        
        
        if (index > total) return reload_in(1);

        let jobs = localStorage.getItem('jobs');
        jobs = [null, undefined].includes(jobs) ? {} : JSON.parse(jobs)

        let job = get_job_from_html(index);
        let key = job_key(job);

        if (jobs[key]) return process_jobs(index + 1);
        jobs[key] = job;

        if (!jobs.updated_at) {
            jobs.updated_at = Date.now()
        }

        if ((Date.now() - jobs.updated_at) > 3600000) {
            jobs = {}
        }

        localStorage.setItem('jobs', JSON.stringify(jobs));


        const notification = notify(job);

        // localStorage.removeItem('jobs')

        notification.addEventListener('close', function () {
            process_jobs(index + 1);
        });
        notification.addEventListener('click', function () {
            ipcRenderer.invoke('open-url', job.link);
            process_jobs(index + 1);
        });
    }



    function load_page_by_scroll() {

        let jobs_placeholders = document.querySelectorAll('[data-test="job-tile-list"] > [data-test="job-tile-list"]');

        if (jobs_placeholders.length == 0) {
            console.log("processing jobs");
            
            process_jobs();
        } else {
            let i = 0;
            const loop = setInterval(() => {
                i++;
                window.scrollTo(0, i * document.body.scrollHeight / 10)

                if (i == 10) {
                    clearInterval(loop);
                    window.scrollTo(0,0)
                    load_page_by_scroll();
                };
            }, 100);
        }
    }

    function reload_in(minutes) {
        setTimeout(() => {
            window.location.reload();
        }, minutes * 60 * 1000);
    }

    load_page_by_scroll();

});