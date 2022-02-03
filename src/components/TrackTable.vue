<template>
  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fichier
                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash
                </th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(row, index) in rows" :key="row.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                       <i :class="row.type=='F'?'fas fa-plane-departure':'fas fa-hiking'" />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ index+1 }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ new Intl.DateTimeFormat('fr-FR', { year: '2-digit', month: 'short', day: '2-digit', hour:'numeric', minute:'numeric', second:'numeric'}).format(new Date(row.dt_start)) }}</div>
                  <div class="text-sm text-gray-500">{{ new Intl.DateTimeFormat('fr-FR', { year: '2-digit', month: 'short', day: '2-digit', hour:'numeric', minute:'numeric', second:'numeric'}).format(new Date(row.dt_end)) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800" :class="isOverlapped(row,overlapped_rows)?'bg-red-100':'bg-green-100'"> 
                    {{ isOverlapped(row,overlapped_rows)?'Chevauchement':'Active' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ row.nb_fixes }}
                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ row.name }}
                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ row.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" class="text-indigo-600 hover:text-indigo-900">Edit</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  props: ["rows","overlapped_rows"],
  methods: {
    isOverlapped(row, overlapped_rows){
    for (let i=0;i<overlapped_rows.length;i++){
      if (row.id == overlapped_rows[i]){
        return true;
      }
      return false;
    }
}
  },
  setup() {
    return {
    }
  },
}
</script>