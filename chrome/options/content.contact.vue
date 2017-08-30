<template>
    <div>
        <contact-reviews-component/>
        <contact-support-component/>
    </div>
</template>

<script>
import translate from "./translate.js";

import ContactReviewsComponent from "./content.contact.reviews.vue";
import ContactSupportComponent from "./content.contact.support.vue";

export default {
    data() {return {}}
    ,components: { ContactReviewsComponent, ContactSupportComponent }
}
</script>
